import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import helmet from 'helmet';
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import { connectDatabase } from './database';
import { config } from './config';
import { logger } from './utils/logger';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/error';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { wsHandler } from './websocket/handler';
import { ApolloServerPluginLandingPageProductionDefault } from 'apollo-server-core';
import { redis } from './redis';
import { metricsRouter } from './metrics';
import { metricsMiddleware } from './middleware/metrics';

// Import route handlers
import authRoutes from './routes/auth';
import agentRoutes from './routes/agents';
import portfolioRoutes from './routes/portfolio';
import marketRoutes from './routes/market';
import paymentRoutes from './routes/payments';
import { paywallMiddleware } from './middleware/paywall';

async function startServer() {
  const app = express();
  
  // Basic middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));
  
  app.use(cors({
    origin: config.security.corsOrigin,
    credentials: true,
  }));
  
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  // Rate limiting
  app.use(rateLimitMiddleware);
  
  // Connect to database
  const dbConnected = await connectDatabase();
  if (!dbConnected) {
    logger.error('Failed to connect to database, exiting...');
    process.exit(1);
  }

  // Connect to Redis
  try {
    await redis.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis, exiting...');
    process.exit(1);
  }

  // Health check endpoint
  app.get('/health', async (req, res) => {
    try {
      // You could add more health checks here (Redis, external APIs, etc.)
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        version: process.env.npm_package_version || '1.0.0',
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/agents', authMiddleware, paywallMiddleware(), agentRoutes);
  app.use('/api/portfolio', authMiddleware, portfolioRoutes);
  app.use('/api/market', marketRoutes);
  app.use('/api/payments', authMiddleware, paymentRoutes);

  // Instantiate long-lived service objects once
  const services = {
    bedrock: new (await import('./services/BedrockService')).BedrockService(),
    x402pay: new (await import('./services/X402PayService')).X402PayService(),
    wallet: new (await import('./services/CDPWalletService')).CDPWalletService(),
    pinata: new (await import('./services/PinataService')).PinataService(),
    // Lazy-load other services as needed
  };

  // GraphQL setup
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      // Make user & services available to resolvers
      return {
        user: (req as any).user || null,
        services,
      };
    },
    introspection: process.env.NODE_ENV !== 'production',
    plugins: process.env.NODE_ENV === 'production' ? [ApolloServerPluginLandingPageProductionDefault()] : [],
  });

  // Apply paywall to GraphQL endpoint
  app.use('/graphql', authMiddleware, paywallMiddleware());

  await server.start();
  server.applyMiddleware({ app: app as any, path: '/graphql' });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  // Create HTTP server
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer });
  wss.on('connection', wsHandler);

  // Metrics collection
  app.use(metricsMiddleware([/\/metrics/]))

  // Expose Prometheus metrics
  app.use('/metrics', metricsRouter);

  // Start the server
  const PORT = config.server.port;
  httpServer.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
    logger.info(`📊 GraphQL endpoint: http://localhost:${PORT}/graphql`);
    logger.info(`🔌 WebSocket endpoint: ws://localhost:${PORT}`);
    logger.info(`💾 Database: Connected`);
    logger.info(`🎯 Environment: ${process.env.NODE_ENV}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    httpServer.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully...');
    httpServer.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
}

// Start the server
startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
}); 
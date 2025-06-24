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

// Import route handlers
import authRoutes from './routes/auth';
import agentRoutes from './routes/agents';
import portfolioRoutes from './routes/portfolio';
import marketRoutes from './routes/market';
import paymentRoutes from './routes/payments';

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
  app.use('/api/agents', authMiddleware, agentRoutes);
  app.use('/api/portfolio', authMiddleware, portfolioRoutes);
  app.use('/api/market', marketRoutes);
  app.use('/api/payments', authMiddleware, paymentRoutes);

  // GraphQL setup
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      // Extract user from JWT token for GraphQL context
      return {
        user: req.user || null,
      };
    },
    introspection: process.env.NODE_ENV !== 'production',
  });

  await server.start();
  server.applyMiddleware({ app: app as any, path: '/graphql' });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  // Create HTTP server
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer });
  wss.on('connection', wsHandler);

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
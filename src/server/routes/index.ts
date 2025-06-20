import { Express } from 'express';
import agentRoutes from './agents';
import authRoutes from './auth';
import paymentRoutes from './payments';
import portfolioRoutes from './portfolio';
import marketRoutes from './market';

export const setupRoutes = (app: Express): void => {
  // Auth routes
  app.use('/api/auth', authRoutes);
  
  // Agent management routes
  app.use('/api/agents', agentRoutes);
  
  // Payment routes
  app.use('/api/payments', paymentRoutes);
  
  // Portfolio routes
  app.use('/api/portfolio', portfolioRoutes);
  
  // Market data routes
  app.use('/api/market', marketRoutes);
}; 
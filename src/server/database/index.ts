import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

let prisma: PrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const logLevels = (process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']) as any;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({ log: logLevels });
  }
  prisma = global.__prisma;
}

export { prisma };

export async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
}

export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error('Database disconnection failed:', error);
  }
}

// Helper functions for common operations
export const db = {
  user: prisma.user,
  agent: prisma.agent,
  trade: prisma.trade,
  wallet: prisma.wallet,
  payment: prisma.payment,
  marketData: prisma.marketData,
  candlestickData: prisma.candlestickData,
  portfolio: prisma.portfolio,
  alert: prisma.alert,
  agentQuery: prisma.agentQuery,
  iPFSData: prisma.iPFSData,
  $transaction: prisma.$transaction.bind(prisma),
  $disconnect: prisma.$disconnect.bind(prisma),
};

export function getClient(): PrismaClient {
  return prisma;
}

export async function healthCheck(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
} 
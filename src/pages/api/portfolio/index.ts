import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { CDPWalletService } from '../../../server/services/CDPWalletService';
import { logger } from '../../../server/utils/logger';
import { verifyToken } from '../../../server/middleware/auth';

const prisma = new PrismaClient();
const cdpWalletService = new CDPWalletService();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify JWT token properly
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = await verifyToken(token);
    const userId = decoded.userId;

    // Get portfolio from database
    let portfolio = await prisma.portfolio.findMany({
      where: { userId },
      orderBy: { balanceUSD: 'desc' },
    });

    // If no portfolio exists, get balance from CDP wallet
    if (portfolio.length === 0) {
      const balances = await cdpWalletService.getBalance(userId);
      
      // Create portfolio entries
      for (const balance of balances) {
        await prisma.portfolio.create({
          data: {
            userId,
            asset: balance.asset,
            balance: balance.balance,
            balanceUSD: balance.balanceUSD,
          },
        });
      }

      // Fetch the created portfolio
      portfolio = await prisma.portfolio.findMany({
        where: { userId },
        orderBy: { balanceUSD: 'desc' },
      });
    }

    res.json({ portfolio });
  } catch (error) {
    logger.error('Failed to fetch portfolio:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
} 
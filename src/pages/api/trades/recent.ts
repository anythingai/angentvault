import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../server/utils/logger';
import { verifyToken } from '../../../server/middleware/auth';

const prisma = new PrismaClient();

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

    const trades = await prisma.trade.findMany({
      where: { userId },
      orderBy: { executedAt: 'desc' },
      take: 20,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({ trades });
  } catch (error) {
    logger.error('Failed to fetch recent trades:', error);
    res.status(500).json({ error: 'Failed to fetch recent trades' });
  }
} 
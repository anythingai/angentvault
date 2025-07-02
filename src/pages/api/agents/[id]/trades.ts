import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../../server/utils/logger';
import { verifyToken } from '../../../../server/middleware/auth';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify JWT token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = await verifyToken(token);
    const userId = decoded.userId;
    const agentId = req.query.id as string;

    // Verify the agent belongs to the user
    const agent = await prisma.agent.findFirst({
      where: { 
        id: agentId,
        userId 
      }
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Fetch trades for this specific agent
    const trades = await prisma.trade.findMany({
      where: { 
        agentId,
        userId 
      },
      orderBy: { executedAt: 'desc' },
      take: 50, // Limit to last 50 trades
      select: {
        id: true,
        type: true,
        fromAsset: true,
        toAsset: true,
        amount: true,
        price: true,
        usdValue: true,
        status: true,
        executedAt: true,
        txHash: true
      }
    });

    res.json({ trades });
  } catch (error) {
    logger.error('Failed to fetch agent trades:', error);
    res.status(500).json({ error: 'Failed to fetch agent trades' });
  }
} 
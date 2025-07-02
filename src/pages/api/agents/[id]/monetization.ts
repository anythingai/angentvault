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

    // Get current date for monthly calculations
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch monetization data
    const [totalPayments, monthlyPayments, totalQueries, subscriberCount] = await Promise.all([
      // Total revenue for this agent
      prisma.payment.aggregate({
        where: {
          agentId,
          status: 'completed'
        },
        _sum: {
          amount: true
        }
      }),
      
      // Monthly revenue
      prisma.payment.aggregate({
        where: {
          agentId,
          status: 'completed',
          createdAt: { gte: monthStart }
        },
        _sum: {
          amount: true
        }
      }),
      
      // Total queries processed
      prisma.agentQuery.count({
        where: { agentId }
      }),
      
      // Subscriber count (unique users who have made payments)
      prisma.payment.findMany({
        where: {
          agentId,
          status: 'completed'
        },
        select: { userId: true },
        distinct: ['userId']
      })
    ]);

    const monetizationData = {
      totalEarned: totalPayments._sum.amount || 0,
      revenueThisMonth: monthlyPayments._sum.amount || 0,
      queriesProcessed: totalQueries,
      subscriberCount: subscriberCount.length
    };

    res.json(monetizationData);
  } catch (error) {
    logger.error('Failed to fetch monetization data:', error);
    res.status(500).json({ error: 'Failed to fetch monetization data' });
  }
} 
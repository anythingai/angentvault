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
    // Require authentication for all requests
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify JWT token
    let userId: string;
    try {
      const decoded = await verifyToken(token);
      userId = decoded.userId;
    } catch (error) {
      logger.warn('Invalid token in portfolio request', { error: error instanceof Error ? error.message : 'Unknown error' });
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Ensure user exists in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        agents: {
          select: {
            id: true,
            name: true,
            status: true,
            performance: true,
            createdAt: true,
          }
        }
      }
    });

    if (!user) {
      logger.warn('User not found for valid token - user may have been deleted', { userId });
      return res.status(401).json({ 
        error: 'Invalid session',
        message: 'Your account was not found. Please login again.'
      });
    }

    // Get wallet balance and portfolio data from CDP
    let walletBalance = 0;
    let portfolioData: any[] = [];
    
    try {
      const balances = await cdpWalletService.getBalance(userId);
      if (balances && balances.length > 0) {
        walletBalance = balances.reduce((sum, balance) => sum + (balance.balanceUSD || 0), 0);
        portfolioData = balances;
      }
    } catch (walletError) {
      logger.error('Failed to fetch wallet balance', { 
        userId, 
        error: walletError instanceof Error ? walletError.message : 'Unknown wallet error' 
      });
      // Continue with partial data rather than failing completely
    }

    // Calculate portfolio metrics
    const totalAgents = user.agents.length;
    const activeAgents = user.agents.filter(agent => agent.status === 'active').length;
    const totalAgentBalance = 0; // Agent balances are tracked separately in Portfolio model

    // Get recent portfolio performance from actual portfolio data
    const portfolioHistory = await prisma.portfolio.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 30, // Last 30 data points
    });

    const response = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          subscription: user.subscription,
          walletAddress: user.walletAddress,
        },
        portfolio: {
          totalValue: walletBalance + totalAgentBalance,
          walletBalance,
          agentBalance: totalAgentBalance,
          currency: 'USD',
          lastUpdated: new Date().toISOString(),
        },
        agents: {
          total: totalAgents,
          active: activeAgents,
          inactive: totalAgents - activeAgents,
          list: user.agents,
        },
        performance: {
          history: portfolioHistory,
          totalReturn: portfolioHistory.length > 1 
            ? ((portfolioHistory[0]?.balanceUSD || 0) - (portfolioHistory[portfolioHistory.length - 1]?.balanceUSD || 0))
            : 0,
          returnPercentage: portfolioHistory.length > 1 && portfolioHistory[portfolioHistory.length - 1]?.balanceUSD
            ? (((portfolioHistory[0]?.balanceUSD || 0) - (portfolioHistory[portfolioHistory.length - 1]?.balanceUSD || 0)) / (portfolioHistory[portfolioHistory.length - 1]?.balanceUSD || 1)) * 100
            : 0,
        },
        externalData: portfolioData,
      },
    };

    logger.info('Portfolio data retrieved successfully', {
      userId,
      agentCount: totalAgents,
      activeAgents,
      portfolioValue: response.data.portfolio.totalValue,
    });

    res.status(200).json(response);

  } catch (error) {
    logger.error('Portfolio API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
                      message: error instanceof Error ? error.message : 'Failed to fetch portfolio data',
    });
  }
} 
import { Router } from 'express';
import { db } from '../database';
import { logger } from '../utils/logger';
import { TradeStatus } from '../../types';

const router = Router();

// Get user portfolio overview
router.get('/', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    // Get user's wallets
    const wallets = await db.wallet.findMany({
      where: { userId, isActive: true },
    });

    // Get recent trades
    const trades = await db.trade.findMany({
      where: {
        agent: { ownerId: userId },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        agent: {
          select: { name: true, id: true },
        },
      },
    });

    // Calculate portfolio stats (mock for demo)
    const portfolioStats = {
      totalValue: 10000, // Mock value
      totalReturn: 1250,
      totalReturnPercentage: 12.5,
      dailyReturn: 2.3,
      weeklyReturn: 8.7,
      monthlyReturn: 12.5,
    };

    res.json({
      success: true,
      data: {
        wallets,
        trades,
        stats: portfolioStats,
        lastUpdated: new Date(),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch portfolio:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch portfolio',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get portfolio performance
router.get('/performance', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    // Get executed trades for performance calculation
    const trades = await db.trade.findMany({
      where: {
        agent: { ownerId: userId },
        status: TradeStatus.EXECUTED,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        agent: {
          select: { name: true },
        },
      },
    });

    // Calculate performance metrics (simplified for demo)
    const totalTrades = trades.length;
    const profitableTrades = trades.filter(t => 
      // Simple mock calculation
      Math.random() > 0.4
    ).length;

    const performance = {
      totalTrades,
      profitableTrades,
      winRate: totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0,
      totalReturn: 1250,
      totalReturnPercentage: 12.5,
      sharpeRatio: 1.8,
      maxDrawdown: -5.2,
      lastUpdated: new Date(),
    };

    res.json({
      success: true,
      data: performance,
    });
  } catch (error) {
    logger.error('Failed to fetch performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get trade history
router.get('/trades', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const trades = await db.trade.findMany({
      where: {
        agent: { ownerId: userId },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        agent: {
          select: { name: true, id: true },
        },
      },
    });

    const totalTrades = await db.trade.count({
      where: {
        agent: { ownerId: userId },
      },
    });

    res.json({
      success: true,
      data: {
        trades,
        pagination: {
          page,
          limit,
          total: totalTrades,
          pages: Math.ceil(totalTrades / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Failed to fetch trade history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trade history',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get wallet balances
router.get('/balances', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const wallets = await db.wallet.findMany({
      where: { userId, isActive: true },
    });

    // Mock balance data for demo
    const balances = wallets.map(wallet => ({
      walletId: wallet.id,
      address: wallet.address,
      balances: [
        { asset: 'USDC', balance: 5000, balanceUSD: 5000 },
        { asset: 'ETH', balance: 1.5, balanceUSD: 4500 },
        { asset: 'BTC', balance: 0.1, balanceUSD: 4500 },
      ],
      totalValueUSD: 14000,
    }));

    res.json({
      success: true,
      data: balances,
    });
  } catch (error) {
    logger.error('Failed to fetch balances:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch balances',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router; 
import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';

const router = Router();

// Get market data for a symbol
router.get('/:symbol', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    
    // Mock market data for demo
    const marketData = {
      symbol: symbol.toUpperCase(),
      price: symbol === 'btc' ? 45000 : symbol === 'eth' ? 3000 : 1,
      volume24h: 1000000000,
      change24h: symbol === 'btc' ? 2000 : symbol === 'eth' ? 150 : 0,
      changePercentage24h: symbol === 'btc' ? 4.65 : symbol === 'eth' ? 5.26 : 0,
      marketCap: symbol === 'btc' ? 900000000000 : symbol === 'eth' ? 360000000000 : 1000000,
      timestamp: new Date()
    };

    res.json({
      success: true,
      data: { marketData }
    });
  } catch (error: any) {
    logger.error('Failed to fetch market data:', error);
    res.status(500).json({
      error: 'Failed to fetch market data',
      message: error.message || 'Unknown error'
    });
  }
});

// Get trending cryptocurrencies
router.get('/trending', async (req: Request, res: Response) => {
  try {
    const trending = [
      { symbol: 'BTC', name: 'Bitcoin', price: 45000, change24h: 4.65 },
      { symbol: 'ETH', name: 'Ethereum', price: 3000, change24h: 5.26 },
      { symbol: 'USDC', name: 'USD Coin', price: 1, change24h: 0.01 }
    ];

    res.json({
      success: true,
      data: { trending }
    });
  } catch (error: any) {
    logger.error('Failed to fetch trending data:', error);
    res.status(500).json({
      error: 'Failed to fetch trending data',
      message: error.message || 'Unknown error'
    });
  }
});

export default router; 
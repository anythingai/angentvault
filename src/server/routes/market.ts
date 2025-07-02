import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import axios from 'axios';

const router = Router();

// Cache for market data to avoid hitting API limits
const marketDataCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

// Get market data for a symbol from real APIs
router.get('/:symbol', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const normalizedSymbol = symbol.toLowerCase();
    
    // Check cache first
    const cached = marketDataCache.get(normalizedSymbol);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json({
        success: true,
        data: { marketData: cached.data }
      });
    }

    // Map common symbols to CoinGecko IDs
    const symbolMap: Record<string, string> = {
      'btc': 'bitcoin',
      'bitcoin': 'bitcoin',
      'eth': 'ethereum',
      'ethereum': 'ethereum',
      'usdc': 'usd-coin',
      'sol': 'solana',
      'solana': 'solana'
    };

    const coinId = symbolMap[normalizedSymbol];
    if (!coinId) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported symbol',
        supportedSymbols: Object.keys(symbolMap)
      });
    }

    // Fetch from CoinGecko API
    const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}`, {
      params: {
        localization: false,
        tickers: false,
        market_data: true,
        community_data: false,
        developer_data: false,
        sparkline: false
      },
      timeout: 10000
    });

    const coinData = response.data;
    const marketData = {
      symbol: symbol.toUpperCase(),
      name: coinData.name,
      price: coinData.market_data.current_price.usd,
      volume24h: coinData.market_data.total_volume.usd,
      change24h: coinData.market_data.price_change_24h,
      changePercentage24h: coinData.market_data.price_change_percentage_24h,
      marketCap: coinData.market_data.market_cap.usd,
      rank: coinData.market_cap_rank,
      timestamp: new Date()
    };

    // Cache the result
    marketDataCache.set(normalizedSymbol, {
      data: marketData,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      data: { marketData }
    });
  } catch (error: any) {
    logger.error('Failed to fetch market data:', error);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        error: 'Market data service timeout',
        message: 'Unable to fetch data from market data provider'
      });
    }
    
    if (error.response?.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests to market data provider'
      });
    }

    res.status(500).json({
      error: 'Failed to fetch market data',
      message: error.message || 'Unknown error'
    });
  }
});

// Get trending cryptocurrencies from real API
router.get('/trending', async (req: Request, res: Response) => {
  try {
    // Check cache first
    const cached = marketDataCache.get('trending');
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json({
        success: true,
        data: { trending: cached.data }
      });
    }

    // Fetch trending from CoinGecko
    const [, topCoinsResponse] = await Promise.all([
      axios.get('https://api.coingecko.com/api/v3/search/trending', { timeout: 10000 }),
      axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 10,
          page: 1,
          sparkline: false
        },
        timeout: 10000
      })
    ]);

    const trending = topCoinsResponse.data.slice(0, 5).map((coin: any) => ({
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      change24h: coin.price_change_percentage_24h,
      marketCap: coin.market_cap,
      rank: coin.market_cap_rank,
      image: coin.image
    }));

    // Cache the result
    marketDataCache.set('trending', {
      data: trending,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      data: { trending }
    });
  } catch (error: any) {
    logger.error('Failed to fetch trending data:', error);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        error: 'Market data service timeout',
        message: 'Unable to fetch trending data'
      });
    }

    res.status(500).json({
      error: 'Failed to fetch trending data',
      message: error.message || 'Unknown error'
    });
  }
});

// Get market summary
router.get('/', async (req: Request, res: Response) => {
  try {
    // Check cache first
    const cached = marketDataCache.get('market_summary');
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json({
        success: true,
        data: cached.data
      });
    }

    // Fetch global market data
    const response = await axios.get('https://api.coingecko.com/api/v3/global', {
      timeout: 10000
    });

    const globalData = response.data.data;
    const marketSummary = {
      totalMarketCap: globalData.total_market_cap.usd,
      total24hVolume: globalData.total_volume.usd,
      marketCapChangePercentage24h: globalData.market_cap_change_percentage_24h_usd,
      activeCryptocurrencies: globalData.active_cryptocurrencies,
      markets: globalData.markets,
      dominance: {
        bitcoin: globalData.market_cap_percentage.btc,
        ethereum: globalData.market_cap_percentage.eth
      },
      lastUpdated: new Date()
    };

    // Cache the result
    marketDataCache.set('market_summary', {
      data: marketSummary,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      data: marketSummary
    });
  } catch (error: any) {
    logger.error('Failed to fetch market summary:', error);
    res.status(500).json({
      error: 'Failed to fetch market summary',
      message: error.message || 'Unknown error'
    });
  }
});

export default router; 
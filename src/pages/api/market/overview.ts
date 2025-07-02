import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { logger } from '../../../server/utils/logger';

interface MarketOverviewResponse {
  success: boolean;
  data?: Array<{
    symbol: string;
    name: string;
    price: number;
    change24h: number;
    volume24h?: number;
    marketCap?: number;
    rank?: number;
    icon: string;
    image?: string;
  }>;
  error?: string;
}

// Cache for market data to avoid hitting API limits
const marketDataCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

function getIconForSymbol(symbol: string): string {
  const iconMap: Record<string, string> = {
    'BTC': '₿',
    'ETH': 'Ξ',
    'USDC': '$',
    'USDT': '$',
    'SOL': '◎',
    'ADA': '₳',
    'DOT': '●',
    'MATIC': '◆',
    'AVAX': '▲',
    'LINK': '🔗'
  };
  
  return iconMap[symbol] || '●';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MarketOverviewResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Check cache first
    const cached = marketDataCache.get('overview');
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.status(200).json({
        success: true,
        data: cached.data
      });
    }

    let overviewData;
    
    try {
      // Try to fetch top coins for overview
      const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 10,
          page: 1,
          sparkline: false,
          price_change_percentage: '24h'
        },
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AgentVault/1.0.0'
        }
      });

      overviewData = response.data.slice(0, 5).map((coin: any) => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        change24h: coin.price_change_percentage_24h || 0,
        volume24h: coin.total_volume,
        marketCap: coin.market_cap,
        rank: coin.market_cap_rank,
        icon: getIconForSymbol(coin.symbol.toUpperCase()),
        image: coin.image
      }));

      logger.info('Market overview data fetched successfully', {
        coinCount: overviewData.length,
        symbols: overviewData.map(coin => coin.symbol).join(', ')
      });
    } catch (fetchError: any) {
      // Handle rate limiting and other errors gracefully
      if (fetchError.response?.status === 429) {
        logger.warn('CoinGecko API rate limited for market overview, using fallback data');
      } else {
        logger.warn('CoinGecko API error for market overview, using fallback data:', fetchError.message);
      }

      // Updated fallback data with current market approximations
      overviewData = [
        { 
          symbol: 'BTC', 
          name: 'Bitcoin',
          price: 96800, 
          change24h: 0.5, 
          icon: '₿', 
          volume24h: 25000000000,
          marketCap: 1900000000000,
          rank: 1,
          image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png'
        },
        { 
          symbol: 'ETH', 
          name: 'Ethereum',
          price: 3350, 
          change24h: 1.2, 
          icon: 'Ξ', 
          volume24h: 15000000000,
          marketCap: 400000000000,
          rank: 2,
          image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'
        },
        { 
          symbol: 'USDT', 
          name: 'Tether USDt',
          price: 1.00, 
          change24h: 0.01, 
          icon: '$', 
          volume24h: 45000000000,
          marketCap: 140000000000,
          rank: 3,
          image: 'https://assets.coingecko.com/coins/images/325/small/Tether.png'
        },
        { 
          symbol: 'XRP', 
          name: 'XRP',
          price: 2.15, 
          change24h: -2.1, 
          icon: '◉', 
          volume24h: 8000000000,
          marketCap: 125000000000,
          rank: 4,
          image: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png'
        },
        { 
          symbol: 'BNB', 
          name: 'BNB',
          price: 695, 
          change24h: 0.8, 
          icon: '◆', 
          volume24h: 2500000000,
          marketCap: 100000000000,
          rank: 5,
          image: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png'
        }
      ];
    }

    // Cache the result (whether from API or fallback)
    marketDataCache.set('overview', {
      data: overviewData,
      timestamp: Date.now()
    });

    res.status(200).json({
      success: true,
      data: overviewData
    });
  } catch (error: any) {
    logger.error('Failed to provide market overview:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market data'
    });
  }
} 
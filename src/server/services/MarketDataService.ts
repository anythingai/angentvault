import axios from 'axios';
import { WebSocket } from 'ws';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { db } from '../database';

// Move interfaces to avoid export conflicts
type MarketTicker = {
  symbol: string;
  price: number;
  volume24h: number;
  change24h: number;
  changePercentage24h: number;
  marketCap?: number;
  lastUpdated: Date;
};

type CandlestickData = {
  symbol: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  interval: string;
};

export class MarketDataService extends EventEmitter {
  private coinbaseWs: WebSocket | null = null;
  private reconnectInterval = 5000;
  private maxReconnectAttempts = 10;
  private reconnectAttempts = 0;
  private subscribedSymbols: Set<string> = new Set();
  private priceUpdateInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Market Data Service');
    
    // Connect to Coinbase WebSocket
    await this.connectWebSocket();
    
    // Start periodic price updates
    this.startPriceUpdates();
    
    logger.info('Market Data Service initialized');
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Market Data Service');
    
    if (this.coinbaseWs) {
      this.coinbaseWs.close();
      this.coinbaseWs = null;
    }
    
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
      this.priceUpdateInterval = null;
    }
    
    logger.info('Market Data Service shutdown complete');
  }

  private async connectWebSocket(): Promise<void> {
    try {
      this.coinbaseWs = new WebSocket('wss://ws-feed.exchange.coinbase.com');
      
      this.coinbaseWs.on('open', () => {
        logger.info('Connected to Coinbase WebSocket');
        this.reconnectAttempts = 0;
        
        // Subscribe to default pairs
        this.subscribeToSymbols(['BTC-USD', 'ETH-USD', 'SOL-USD']);
      });
      
      this.coinbaseWs.on('message', (data: Buffer) => {
        this.handleWebSocketMessage(data);
      });
      
      this.coinbaseWs.on('error', (error) => {
        logger.error('WebSocket error:', error);
      });
      
      this.coinbaseWs.on('close', () => {
        logger.warn('WebSocket connection closed');
        this.handleReconnect();
      });
    } catch (error) {
      logger.error('Failed to connect to WebSocket:', error);
      this.handleReconnect();
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      logger.info(`Reconnecting in ${this.reconnectInterval}ms... (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connectWebSocket();
      }, this.reconnectInterval);
    } else {
      logger.error('Max reconnection attempts reached');
    }
  }

  private subscribeToSymbols(symbols: string[]): void {
    if (!this.coinbaseWs || this.coinbaseWs.readyState !== WebSocket.OPEN) {
      logger.warn('WebSocket not connected, cannot subscribe');
      return;
    }
    
    const subscribeMessage = {
      type: 'subscribe',
      product_ids: symbols,
      channels: ['ticker', 'level2', 'matches']
    };
    
    this.coinbaseWs.send(JSON.stringify(subscribeMessage));
    symbols.forEach(symbol => this.subscribedSymbols.add(symbol));
    
    logger.info('Subscribed to symbols:', symbols);
  }

  private handleWebSocketMessage(data: Buffer): void {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'ticker':
          this.handleTickerMessage(message);
          break;
        case 'l2update':
          this.handleLevel2Update(message);
          break;
        case 'match':
          this.handleMatchMessage(message);
          break;
      }
    } catch (error) {
      logger.error('Failed to handle WebSocket message:', error);
    }
  }

  private async handleTickerMessage(message: any): Promise<void> {
    const ticker: MarketTicker = {
      symbol: message.product_id.replace('-', '/'),
      price: parseFloat(message.price),
      volume24h: parseFloat(message.volume_24h),
      change24h: parseFloat(message.price) - parseFloat(message.open_24h),
      changePercentage24h: ((parseFloat(message.price) - parseFloat(message.open_24h)) / parseFloat(message.open_24h)) * 100,
      lastUpdated: new Date(message.time)
    };
    
    // Update database
    await this.updateMarketData(ticker);
    
    // Emit event for real-time subscribers
    this.emit('ticker', ticker);
  }

  private handleLevel2Update(message: any): void {
    // Emit order book updates for trading algorithms
    this.emit('orderbook', {
      symbol: message.product_id.replace('-', '/'),
      changes: message.changes,
      time: message.time
    });
  }

  private handleMatchMessage(message: any): void {
    // Emit trade execution events
    this.emit('trade', {
      symbol: message.product_id.replace('-', '/'),
      price: parseFloat(message.price),
      size: parseFloat(message.size),
      side: message.side,
      time: message.time
    });
  }

  private async updateMarketData(ticker: MarketTicker): Promise<void> {
    try {
      await db.marketData.upsert({
        where: { symbol: ticker.symbol },
        update: {
          price: ticker.price,
          volume24h: ticker.volume24h,
          change24h: ticker.change24h,
          changePercentage24h: ticker.changePercentage24h,
          marketCap: ticker.marketCap,
          lastUpdated: ticker.lastUpdated
        },
        create: {
          symbol: ticker.symbol,
          price: ticker.price,
          volume24h: ticker.volume24h,
          change24h: ticker.change24h,
          changePercentage24h: ticker.changePercentage24h,
          marketCap: ticker.marketCap,
          lastUpdated: ticker.lastUpdated
        }
      });
    } catch (error) {
      logger.error('Failed to update market data:', error);
    }
  }

  /**
   * Get current market data for symbols
   */
  async getMarketData(symbols: string[]): Promise<MarketTicker[]> {
    try {
      const data = await db.marketData.findMany({
        where: {
          symbol: { in: symbols }
        }
      });
      
      return data.map(d => ({
        symbol: d.symbol,
        price: d.price,
        volume24h: d.volume24h,
        change24h: d.change24h,
        changePercentage24h: d.changePercentage24h,
        marketCap: d.marketCap ?? undefined,
        lastUpdated: d.lastUpdated
      }));
    } catch (error) {
      logger.error('Failed to get market data:', error);
      throw error;
    }
  }

  /**
   * Get historical candlestick data
   */
  async getCandlestickData(
    symbol: string,
    interval: string,
    start: Date,
    end: Date
  ): Promise<CandlestickData[]> {
    try {
      const data = await db.candlestickData.findMany({
        where: {
          symbol,
          interval,
          timestamp: {
            gte: start,
            lte: end
          }
        },
        orderBy: { timestamp: 'asc' }
      });
      
      return data;
    } catch (error) {
      logger.error('Failed to get candlestick data:', error);
      throw error;
    }
  }

  /**
   * Start periodic price updates from external APIs
   */
  private startPriceUpdates(): void {
    // Update prices every 5 minutes to respect rate limits
    this.priceUpdateInterval = setInterval(async () => {
      await this.fetchExternalPrices();
    }, 300000); // 5 minutes instead of 30 seconds
    
    // Initial fetch with delay to avoid immediate rate limiting
    setTimeout(() => {
      this.fetchExternalPrices();
    }, 10000); // Wait 10 seconds before first fetch
  }

  /**
   * Fetch prices from external APIs (backup for WebSocket)
   */
  private async fetchExternalPrices(): Promise<void> {
    try {
      // Fetch from CoinGecko API with timeout
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids: 'bitcoin,ethereum,solana',
          vs_currencies: 'usd',
          include_24hr_vol: true,
          include_24hr_change: true,
          include_market_cap: true
        },
        timeout: 10000, // 10 second timeout
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AgentVault/1.0.0'
        }
      });
      
      // Map CoinGecko data to our format
      const tickers: MarketTicker[] = [
        {
          symbol: 'BTC/USD',
          price: response.data.bitcoin.usd,
          volume24h: response.data.bitcoin.usd_24h_vol,
          change24h: response.data.bitcoin.usd_24h_change,
          changePercentage24h: response.data.bitcoin.usd_24h_change,
          marketCap: response.data.bitcoin.usd_market_cap,
          lastUpdated: new Date()
        },
        {
          symbol: 'ETH/USD',
          price: response.data.ethereum.usd,
          volume24h: response.data.ethereum.usd_24h_vol,
          change24h: response.data.ethereum.usd_24h_change,
          changePercentage24h: response.data.ethereum.usd_24h_change,
          marketCap: response.data.ethereum.usd_market_cap,
          lastUpdated: new Date()
        },
        {
          symbol: 'SOL/USD',
          price: response.data.solana.usd,
          volume24h: response.data.solana.usd_24h_vol,
          change24h: response.data.solana.usd_24h_change,
          changePercentage24h: response.data.solana.usd_24h_change,
          marketCap: response.data.solana.usd_market_cap,
          lastUpdated: new Date()
        }
      ];
      
      // Update database with external prices
      for (const ticker of tickers) {
        await this.updateMarketData(ticker);
      }
      
      logger.info('External prices updated successfully');
    } catch (error: any) {
      if (error.response?.status === 429) {
        logger.warn('CoinGecko API rate limit exceeded, will retry later', {
          retryAfter: error.response?.headers?.['retry-after'] || '60'
        });
        // Don't treat rate limiting as a hard error - just wait for next interval
        return;
      }
      
      // For other errors, use fallback data to ensure the app keeps working
      await this.useFallbackData();
      logger.error('Failed to fetch external prices, using fallback data:', error);
    }
  }

  /**
   * Use fallback market data when external APIs are unavailable
   * Only allowed in development or test environments
   */
  private async useFallbackData(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Fallback market data is not allowed in production.');
    }
    try {
      // Use reasonable fallback prices (approximate current market values)
      const fallbackTickers: MarketTicker[] = [
        {
          symbol: 'BTC/USD',
          price: 96800,
          volume24h: 25000000000,
          change24h: 0.5,
          changePercentage24h: 0.5,
          marketCap: 1900000000000,
          lastUpdated: new Date()
        },
        {
          symbol: 'ETH/USD',
          price: 3350,
          volume24h: 15000000000,
          change24h: 1.2,
          changePercentage24h: 1.2,
          marketCap: 400000000000,
          lastUpdated: new Date()
        },
        {
          symbol: 'SOL/USD',
          price: 185,
          volume24h: 2000000000,
          change24h: -0.8,
          changePercentage24h: -0.8,
          marketCap: 85000000000,
          lastUpdated: new Date()
        }
      ];

      // Only update if we don't have recent data (older than 1 hour)
      for (const ticker of fallbackTickers) {
        const existingData = await db.marketData.findUnique({
          where: { symbol: ticker.symbol }
        });
        
        if (!existingData || 
            (new Date().getTime() - existingData.lastUpdated.getTime()) > 3600000) {
          await this.updateMarketData(ticker);
        }
      }
      
      logger.info('Fallback market data applied');
    } catch (error) {
      logger.error('Failed to apply fallback data:', error);
    }
  }

  /**
   * Subscribe to real-time market updates
   */
  subscribeToMarketUpdates(symbols: string[]): void {
    this.subscribeToSymbols(symbols.map(s => s.replace('/', '-')));
  }

  /**
   * Get market summary for all tracked assets
   */
  async getMarketSummary(): Promise<any> {
    try {
      const data = await db.marketData.findMany({
        orderBy: { marketCap: 'desc' }
      });
      
      const totalMarketCap = data.reduce((sum, d) => sum + (d.marketCap || 0), 0);
      const avgChange24h = data.reduce((sum, d) => sum + d.changePercentage24h, 0) / data.length;
      
      return {
        totalMarketCap,
        avgChange24h,
        totalAssets: data.length,
        assets: data,
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error('Failed to get market summary:', error);
      throw error;
    }
  }
} 
import { db } from '../database';
import { logger } from '../utils/logger';
import { BedrockService } from './BedrockService';
import { CDPWalletService } from './CDPWalletService';
import { X402PayService } from './X402PayService';
import { PinataService } from './PinataService';
import { MarketDataService } from './MarketDataService';
import { config } from '../config';
import { agentTradeCounter } from '../metrics';

export class AgentOrchestrator {
  private bedrockService: BedrockService;
  private walletService: CDPWalletService;
  private paymentService: X402PayService;
  private pinataService: PinataService;
  private marketDataService: MarketDataService;
  private activeAgents: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.bedrockService = new BedrockService();
    this.walletService = new CDPWalletService();
    this.paymentService = new X402PayService();
    this.pinataService = new PinataService();
    this.marketDataService = new MarketDataService();
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Agent Orchestrator');
    
    // Initialize market data streaming
    try {
      await this.marketDataService.initialize();
    } catch (mdErr) {
      logger.error('Failed to initialize market data service:', mdErr);
    }
    
    // Start monitoring active agents
    await this.loadActiveAgents();
    
    logger.info('Agent Orchestrator initialized successfully');
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Agent Orchestrator');
    
    // Stop all active agents
    for (const [agentId, interval] of this.activeAgents.entries()) {
      clearInterval(interval);
      logger.info('Stopped agent', { agentId });
    }
    
    this.activeAgents.clear();
    await this.marketDataService.shutdown();
    logger.info('Agent Orchestrator shutdown complete');
  }

  private async loadActiveAgents(): Promise<void> {
    try {
      const activeAgents = await db.agent.findMany({
        where: { status: 'ACTIVE' }
      });

      for (const agent of activeAgents) {
        await this.startAgent(agent.id);
      }

      logger.info('Loaded active agents', { count: activeAgents.length });
    } catch (error) {
      logger.error('Failed to load active agents:', error);
    }
  }

  async startAgent(agentId: string): Promise<void> {
    try {
      if (this.activeAgents.has(agentId)) {
        logger.warn('Agent already running', { agentId });
        return;
      }

      const agent = await db.agent.findUnique({
        where: { id: agentId },
        include: { owner: true }
      });

      if (!agent) {
        throw new Error('Agent not found');
      }

      // Start agent execution loop
      const interval = setInterval(async () => {
        await this.executeAgentCycle(agent);
      }, 60000); // Run every minute

      this.activeAgents.set(agentId, interval);
      
      // Update agent status
      await db.agent.update({
        where: { id: agentId },
        data: { status: 'ACTIVE' }
      });

      logger.info('Agent started', { agentId, ownerId: agent.ownerId });
    } catch (error) {
      logger.error('Failed to start agent:', error);
      throw error;
    }
  }

  async stopAgent(agentId: string): Promise<void> {
    try {
      const interval = this.activeAgents.get(agentId);
      if (interval) {
        clearInterval(interval);
        this.activeAgents.delete(agentId);
      }

      await db.agent.update({
        where: { id: agentId },
        data: { status: 'PAUSED' }
      });

      logger.info('Agent stopped', { agentId });
    } catch (error) {
      logger.error('Failed to stop agent:', error);
      throw error;
    }
  }

  private async executeAgentCycle(agent: any): Promise<void> {
    try {
      logger.info('Executing agent cycle', { agentId: agent.id });

      // Get market data
      const marketData = await this.getMarketData(agent.config.tradingPairs || []);

      // Analyze market using Bedrock
      const analysis = await this.bedrockService.analyzeMarketSentiment(marketData);

      // Make trading decision based on analysis
      const decision = await this.makeTradeDecision(agent, analysis);

      if (decision.shouldTrade) {
        // Execute trade via CDP Wallet
        await this.executeTrade(agent, decision);
      }

      // Store analysis
      await db.aiAnalysis.create({
        data: {
          agentId: agent.id,
          userId: agent.ownerId, // Add the required user field
          type: 'MARKET_SENTIMENT',
          input: marketData,
          output: analysis,
          confidence: 0.85,
          reasoning: 'Automated agent analysis cycle'
        }
      });

      // Upload analysis to IPFS (non-blocking)
      try {
        await this.pinataService.uploadJSON({ agentId: agent.id, marketData, analysis }, `analysis_${agent.id}_${Date.now()}.json`);
      } catch (pinErr) {
        logger.warn('Pinata upload failed', pinErr);
      }

      logger.info('Agent cycle completed', { agentId: agent.id });
    } catch (error) {
      logger.error('Agent cycle failed:', error);
      
      // Update agent status to error
      await db.agent.update({
        where: { id: agent.id },
        data: { status: 'ERROR' }
      });
    }
  }

  private async getMarketData(tradingPairs: string[]): Promise<any> {
    if (!tradingPairs.length) return {};

    try {
      const tickers = await this.marketDataService.getMarketData(tradingPairs);
      const formatted: Record<string, any> = {};
      tickers.forEach(t => {
        formatted[t.symbol] = {
          price: t.price,
          volume: t.volume24h,
          change24h: t.change24h,
        };
      });
      return formatted;
    } catch (error) {
      logger.error('Failed to fetch live market data, falling back to mock:', error);
      // fallback to mock if service unavailable
      const data: any = {};
      for (const pair of tradingPairs) {
        data[pair] = {
          price: 0,
          volume: 0,
          change24h: 0,
        };
      }
      return data;
    }
  }

  private async makeTradeDecision(_agent: any, _analysis: any): Promise<any> {
    // Simple decision logic for demo
    const shouldTrade = Math.random() > 0.8; // 20% chance to trade
    
    return {
      shouldTrade,
      action: shouldTrade ? (Math.random() > 0.5 ? 'buy' : 'sell') : null,
      amount: shouldTrade ? 100 : 0,
      symbol: 'BTC/USDC'
    };
  }

  private async executeTrade(agent: any, decision: any): Promise<void> {
    try {
      const [baseAsset, quoteAsset] = decision.symbol.split('/');

      logger.info('Initiating wallet trade', {
        agentId: agent.id,
        action: decision.action,
        amount: decision.amount,
        baseAsset,
        quoteAsset,
      });

      if (config.features?.enableRealTrading) {
        await this.walletService.executeTrade(
          agent.ownerId,
          decision.action === 'buy' ? quoteAsset : baseAsset,
          decision.action === 'buy' ? baseAsset : quoteAsset,
          decision.amount,
          decision.action.toUpperCase(),
        );
      }

      const tradeRecord = await db.trade.create({
        data: {
          agentId: agent.id,
          type: decision.action.toUpperCase(),
          symbol: decision.symbol,
          amount: decision.amount,
          price: decision.price || 0,
          status: 'EXECUTED',
        },
      });

      // Upload trade record to IPFS (non-blocking)
      try {
        await this.pinataService.uploadJSON(tradeRecord, `trade_${tradeRecord.id}.json`);
      } catch (err) {
        logger.warn('Pinata trade upload failed', err);
      }

      agentTradeCounter.inc({ symbol: decision.symbol, type: decision.action.toUpperCase() });

      logger.info('Trade record stored', { agentId: agent.id });
    } catch (error) {
      logger.error('Trade execution failed:', error);
      throw error;
    }
  }
} 
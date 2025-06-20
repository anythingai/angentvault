import { db, getClient } from '../database';
import { logger } from '../utils/logger';
import { BedrockService } from './BedrockService';
import { CDPWalletService } from './CDPWalletService';
import { X402PayService } from './X402PayService';
import { PinataService } from './PinataService';

export class AgentOrchestrator {
  private bedrockService: BedrockService;
  private walletService: CDPWalletService;
  private paymentService: X402PayService;
  private pinataService: PinataService;
  private activeAgents: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.bedrockService = new BedrockService();
    this.walletService = new CDPWalletService();
    this.paymentService = new X402PayService();
    this.pinataService = new PinataService();
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Agent Orchestrator');
    
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
      const analysisRecord = await db.aiAnalysis.create({
        data: {
          agentId: agent.id,
          userId: agent.ownerId, // Add the required user field
          type: 'MARKET_SENTIMENT',
          input: JSON.stringify(marketData),
          output: JSON.stringify(analysis),
          confidence: 0.85,
          reasoning: 'Automated agent analysis cycle'
        }
      });

      // Store analysis on IPFS for immutable audit trail
      await this.pinataService.storeAIAnalysis(agent.ownerId, agent.id, {
        ...analysisRecord,
        marketData,
        analysis
      });

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
    // Mock market data for demo
    const data: any = {};
    
    for (const pair of tradingPairs) {
      data[pair] = {
        price: pair.includes('BTC') ? 45000 : pair.includes('ETH') ? 3000 : 1,
        volume: 1000000,
        change24h: Math.random() * 10 - 5 // Random change between -5% and +5%
      };
    }

    return data;
  }

  private async makeTradeDecision(agent: any, analysis: any): Promise<any> {
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
      // This would integrate with CDP Wallet for actual trading
      logger.info('Executing trade', { 
        agentId: agent.id, 
        action: decision.action,
        amount: decision.amount,
        symbol: decision.symbol 
      });

      const trade = await db.trade.create({
        data: {
          agentId: agent.id,
          type: decision.action.toUpperCase(),
          symbol: decision.symbol,
          amount: decision.amount,
          price: 45000, // Mock price
          status: 'EXECUTED'
        }
      });

      // Store trade history on IPFS for immutable audit trail
      const recentTrades = await db.trade.findMany({
        where: { agentId: agent.id },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      await this.pinataService.storeTradeHistory(agent.ownerId, agent.id, recentTrades);

      logger.info('Trade executed successfully', { agentId: agent.id });
    } catch (error) {
      logger.error('Trade execution failed:', error);
      throw error;
    }
  }
} 
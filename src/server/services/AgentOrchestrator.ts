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

      // Enable autonomous payments for the agent
      await this.paymentService.enableAutonomousPayments(
        agentId,
        agent.walletAddress || 'default-wallet'
      );

      // Start agent execution loop
      const interval = setInterval(async () => {
        await this.executeAgentCycle(agent);
      }, config.agent?.executionInterval || 60000); // Run every minute

      this.activeAgents.set(agentId, interval);
      
      // Update agent status
      await db.agent.update({
        where: { id: agentId },
        data: { status: 'ACTIVE' }
      });

      // Store agent configuration on IPFS
      await this.pinataService.storeAgentConfig(agentId, agent.config);

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
      const marketData = await this.getMarketData(agent.config.tradingPairs || ['BTC/USD', 'ETH/USD']);

      // Perform comprehensive market analysis using Bedrock
      const analysis = await this.performComprehensiveAnalysis(agent, marketData);

      // Make trading decision based on analysis
      const decision = await this.makeInformedTradeDecision(agent, analysis, marketData);

      if (decision.shouldTrade) {
        // Check if user has sufficient balance
        const balances = await this.walletService.getBalance(agent.ownerId);
        const hasSufficientBalance = this.checkSufficientBalance(balances, decision);
        
        if (hasSufficientBalance) {
        // Execute trade via CDP Wallet
        await this.executeTrade(agent, decision);
          
          // Record successful trade
          await this.recordTradeExecution(agent, decision, analysis);
        } else {
          logger.warn('Insufficient balance for trade', { agentId: agent.id, decision });
        }
      }

      // Store analysis on IPFS
      const analysisResult = await this.pinataService.storeAIAnalysis(agent.id, {
        marketData,
        analysis,
        decision,
        executedAt: new Date().toISOString()
      });

      // Update agent state
      await this.updateAgentState(agent.id, {
        lastAnalysis: analysis,
        lastDecision: decision,
        lastAnalysisIPFS: analysisResult.ipfsHash,
        lastExecutionTime: new Date()
      });

      logger.info('Agent cycle completed', { agentId: agent.id });
    } catch (error) {
      logger.error('Agent cycle failed:', error);
      
      // Update agent status to error
      await db.agent.update({
        where: { id: agent.id },
        data: { status: 'ERROR' }
      });
      
      // Create error audit trail
      await this.pinataService.createAuditTrail(agent.id, [{
        type: 'ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      }]);
    }
  }

  private async performComprehensiveAnalysis(agent: any, marketData: any): Promise<any> {
    const symbol = agent.config.primarySymbol || 'BTC';
    
    // Perform multiple types of analysis
    const [sentiment, prediction, risk, opportunities] = await Promise.all([
      this.bedrockService.analyzeMarketSentiment(marketData),
      this.bedrockService.predictPrice(symbol, this.formatHistoricalData(marketData), '1H'),
      this.bedrockService.assessRisk(agent.portfolio || {}, marketData),
      this.bedrockService.detectOpportunities([marketData], agent.config.strategies || ['momentum'])
    ]);

    return {
      sentiment,
      prediction,
      risk,
      opportunities,
      timestamp: new Date()
    };
  }

  private async makeInformedTradeDecision(agent: any, analysis: any, marketData: any): Promise<any> {
    // Use Bedrock to generate a trading decision
    const symbol = agent.config.primarySymbol || 'BTC';
    const decision = await this.bedrockService.generateAgentDecision(symbol);
    
    // Validate decision against risk parameters
    const riskScore = analysis.risk?.risk_score || 5;
    const confidence = decision.confidence || 0.5;
    const maxRisk = agent.config.maxRiskScore || 7;
    
    const shouldTrade = confidence > 0.7 && riskScore < maxRisk;
    
    return {
      shouldTrade,
      action: decision.side?.toLowerCase() || 'hold',
      symbol: decision.symbol || symbol,
      amount: this.calculatePositionSize(agent, analysis, marketData),
      price: marketData[symbol]?.price || 0,
      confidence,
      riskScore,
      reasoning: `Confidence: ${confidence}, Risk: ${riskScore}/${maxRisk}`
    };
  }

  private calculatePositionSize(agent: any, analysis: any, _marketData: any): number {
    const baseAmount = agent.config.baseTradeAmount || 100;
    const maxPosition = agent.config.maxPositionSize || 1000;
    const riskMultiplier = 1 - (analysis.risk?.risk_score || 5) / 10;
    
    return Math.min(baseAmount * riskMultiplier, maxPosition);
  }

  private checkSufficientBalance(balances: any[], decision: any): boolean {
    const requiredAsset = decision.action === 'buy' ? 'USDC' : decision.symbol.split('/')[0];
    const balance = balances.find(b => b.asset === requiredAsset);
    return balance && balance.balance >= decision.amount;
  }

  private async recordTradeExecution(agent: any, decision: any, _analysis: any): Promise<void> {
    // Create trade record
    const trade = await db.trade.create({
      data: {
        agentId: agent.id,
        type: decision.action.toUpperCase(),
        symbol: decision.symbol,
        amount: decision.amount,
        price: decision.price,
        status: 'EXECUTED',
        confidence: decision.confidence,
        metadata: JSON.stringify({
          riskScore: decision.riskScore,
          reasoning: decision.reasoning
        }) as any
      }
    });

    // Store trade on IPFS
    await this.pinataService.storeTradingHistory(agent.id, [trade]);

    // Create payment record for monetization
    if (agent.config.chargePerTrade) {
      await this.paymentService.processAgentQuery(
        agent.ownerId,
        agent.id,
        'trade_execution'
      );
      
      // Store monetization record
      await this.pinataService.storeMonetizationRecord(agent.id, {
        type: 'trade_execution',
        amount: 0.01, // $0.01 per trade
        tradeId: trade.id
      });
    }

    // Update metrics
    agentTradeCounter.inc({ 
      symbol: decision.symbol, 
      type: decision.action.toUpperCase() 
    });
  }

  private async updateAgentState(agentId: string, state: any): Promise<void> {
    // Update agent in database
    await db.agent.update({
      where: { id: agentId },
      data: {
        lastExecutionTime: state.lastExecutionTime,
        metadata: JSON.stringify({
          ...state,
          updatedAt: new Date()
        }) as any
      }
    });

    // Store state on IPFS
    await this.pinataService.storeAgentState(agentId, state);
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
          changePercentage24h: t.changePercentage24h,
          marketCap: t.marketCap,
          lastUpdated: t.lastUpdated
        };
      });
      return formatted;
    } catch (error) {
      logger.error('Failed to fetch live market data, using mock:', error);
      // Fallback to mock data
      const mockData: any = {};
      for (const pair of tradingPairs) {
        mockData[pair] = {
          price: pair.includes('BTC') ? 45000 : pair.includes('ETH') ? 3000 : 100,
          volume: 1000000,
          change24h: Math.random() * 10 - 5,
          changePercentage24h: Math.random() * 10 - 5,
          marketCap: 1000000000,
          lastUpdated: new Date()
        };
      }
      return mockData;
    }
  }

  private formatHistoricalData(marketData: any): any[] {
    // Convert current market data to historical format for analysis
    return Object.entries(marketData).map(([symbol, data]: [string, any]) => ({
      symbol,
      timestamp: data.lastUpdated || new Date(),
      open: data.price * 0.98,
      high: data.price * 1.01,
      low: data.price * 0.97,
      close: data.price,
      volume: data.volume
    }));
  }

  private async executeTrade(agent: any, decision: any): Promise<void> {
    try {
      const [baseAsset, quoteAsset] = decision.symbol.split('/');

      logger.info('Executing trade', {
        agentId: agent.id,
        action: decision.action,
        amount: decision.amount,
        symbol: decision.symbol
      });

      if (config.features?.enableRealTrading) {
        const result = await this.walletService.executeTrade(
          agent.ownerId,
          decision.action === 'buy' ? quoteAsset : baseAsset,
          decision.action === 'buy' ? baseAsset : quoteAsset,
          decision.amount,
          decision.action.toUpperCase()
        );

        logger.info('Trade executed successfully', { 
          agentId: agent.id,
          transactionHash: result.transactionHash 
        });
      } else {
        logger.info('Trade simulated (real trading disabled)', { agentId: agent.id });
      }
    } catch (error) {
      logger.error('Trade execution failed:', error);
      throw error;
    }
  }
} 
import { db } from '../database';
import { logger } from '../utils/logger';
import { BedrockService } from './BedrockService';
import { CDPWalletService } from './CDPWalletService';
import { X402PayService } from './X402PayService';
import { PinataService } from './PinataService';
import { MarketDataService } from './MarketDataService';
import { config } from '../config';
import { agentTradeCounter } from '../metrics';
import { TradeType } from '../../types';

export interface AgentConfig {
  id: string;
  userId: string;
  name: string;
  strategy: string;
  riskLevel: 'low' | 'medium' | 'high';
  maxTradeSize: number;
  enabled: boolean;
  assets: string[];
  tradingInterval: number; // in milliseconds
  lastExecuted?: Date;
}

export interface TradeDecision {
  symbol: string;
  side: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  amount?: number;
  reasoning?: string;
  timestamp: Date;
}

export interface TradeExecution {
  agentId: string;
  decision: TradeDecision;
  execution: any;
  ipfsHash?: string;
  success: boolean;
  error?: string;
  timestamp: Date;
}

export class AgentOrchestrator {
  private bedrockService: BedrockService;
  private walletService: CDPWalletService;
  private paymentService: X402PayService;
  private pinataService: PinataService;
  private marketDataService: MarketDataService;
  private activeAgents: Map<string, AgentConfig> = new Map();
  private executionTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.bedrockService = new BedrockService();
    this.walletService = new CDPWalletService();
    this.paymentService = new X402PayService();
    this.pinataService = new PinataService();
    this.marketDataService = new MarketDataService();

    logger.info('AgentOrchestrator initialized');
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
    for (const [agentId, interval] of this.executionTimers.entries()) {
      clearInterval(interval);
      logger.info('Stopped agent', { agentId });
    }
    
    this.executionTimers.clear();
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

      this.executionTimers.set(agentId, interval);
      
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
      const interval = this.executionTimers.get(agentId);
      if (interval) {
        clearInterval(interval);
        this.executionTimers.delete(agentId);
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

  /**
   * Deploy a new autonomous agent
   */
  async deployAgent(agentConfig: AgentConfig): Promise<{ success: boolean; agentId: string }> {
    try {
      // Validate agent configuration
      this.validateAgentConfig(agentConfig);

      // Store agent configuration on Pinata for immutability
      const configResult = await this.pinataService.storeAgentConfig(agentConfig.id, agentConfig);
      logger.info('Agent configuration stored on IPFS', { 
        agentId: agentConfig.id, 
        ipfsHash: configResult.ipfsHash 
      });

      // Add to active agents
      this.activeAgents.set(agentConfig.id, {
        ...agentConfig,
        lastExecuted: new Date()
      });

      // Start execution timer
      this.startAgentExecution(agentConfig);

      logger.info('Agent deployed successfully', { agentId: agentConfig.id });
      return { success: true, agentId: agentConfig.id };
    } catch (error) {
      logger.error('Failed to deploy agent', { agentId: agentConfig.id, error });
      throw error;
    }
  }

  /**
   * Execute trading decision for an agent
   */
  async executeAgentDecision(agentId: string): Promise<TradeExecution | null> {
    try {
      const agent = this.activeAgents.get(agentId);
      if (!agent || !agent.enabled) {
        return null;
      }

      logger.info('Executing agent decision', { agentId });

      // Get market data for analysis
      const marketData = await this.marketDataService.getMarketData(agent.assets);
      
      // Get AI decision from Bedrock
      const decision = await this.generateTradingDecision(agent, marketData);
      if (!decision) {
        logger.info('No trading decision generated', { agentId });
        return null;
      }

      // Execute trade if confidence is high enough
      const execution = await this.executeTradeForAgent(agent, decision);

      // Store execution results on Pinata
      const tradeRecord = {
        agentId,
        decision,
        execution,
        success: execution.success,
        timestamp: new Date(),
        marketData: marketData[decision.symbol],
      };

      const pinataResult = await this.pinataService.storeTradingHistory(agentId, [tradeRecord]);
      
      const result: TradeExecution = {
        ...tradeRecord,
        ipfsHash: pinataResult.ipfsHash,
      };

      // Update agent's last execution time
      agent.lastExecuted = new Date();

      logger.info('Agent decision executed', { 
        agentId, 
        symbol: decision.symbol, 
        side: decision.side,
        success: execution.success,
        ipfsHash: pinataResult.ipfsHash
      });

      return result;
    } catch (error) {
      logger.error('Failed to execute agent decision', { agentId, error });
      return {
        agentId,
        decision: null as any,
        execution: { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Generate trading decision using AI
   */
  private async generateTradingDecision(agent: AgentConfig, marketData: any): Promise<TradeDecision | null> {
    try {
      // Use different Bedrock methods based on strategy
      let analysisResult;
      
      switch (agent.strategy) {
        case 'sentiment_analysis':
          analysisResult = await this.bedrockService.analyzeMarketSentiment(marketData);
          break;
        case 'opportunity_detection':
          analysisResult = await this.bedrockService.detectOpportunities(
            Object.values(marketData), 
            [agent.strategy]
          );
          break;
        default:
          // Use simple decision for demo
          analysisResult = await this.bedrockService.generateAgentDecision(agent.assets[0]);
      }

      if (!analysisResult || !analysisResult.content) {
        return null;
      }

      // Parse Bedrock response based on tool use
      let decision: TradeDecision;
      
      if (analysisResult.content[0]?.type === 'tool_use') {
        const toolResult = analysisResult.content[0].input;
        decision = {
          symbol: toolResult.symbol || agent.assets[0],
          side: toolResult.side || toolResult.action?.toUpperCase() || 'HOLD',
          confidence: toolResult.confidence || 0.5,
          reasoning: toolResult.reasoning || 'AI-generated decision',
          timestamp: new Date(),
        };
      } else {
        // Fallback parsing for direct text response
        try {
          const textContent = analysisResult.content[0]?.text || '{}';
          const parsed = JSON.parse(textContent);
          decision = {
            symbol: parsed.symbol || agent.assets[0],
            side: parsed.side || 'HOLD',
            confidence: parsed.confidence || 0.5,
            reasoning: parsed.reasoning || 'AI-generated decision',
            timestamp: new Date(),
          };
        } catch {
          // Default safe decision
          return null;
        }
      }

      // Only proceed if confidence is above threshold
      const confidenceThreshold = agent.riskLevel === 'low' ? 0.8 : 
                                 agent.riskLevel === 'medium' ? 0.6 : 0.4;
      
      if (decision.confidence < confidenceThreshold || decision.side === 'HOLD') {
        logger.info('Decision confidence too low or HOLD signal', { 
          agentId: agent.id, 
          confidence: decision.confidence, 
          threshold: confidenceThreshold,
          side: decision.side
        });
        return null;
      }

      // Calculate trade amount based on risk level
      decision.amount = this.calculateTradeAmount(agent, decision);

      return decision;
    } catch (error) {
      logger.error('Failed to generate trading decision', { agentId: agent.id, error });
      return null;
    }
  }

  /**
   * Execute trade for agent and return result
   */
  private async executeTradeForAgent(agent: AgentConfig, decision: TradeDecision): Promise<any> {
    try {
      if (!decision.amount || decision.amount <= 0) {
        return { success: false, error: 'Invalid trade amount' };
      }

      const tradeType = decision.side === 'BUY' ? TradeType.BUY : TradeType.SELL;
      
      // For demo purposes, we'll simulate with USDC as base currency
      const fromAsset = decision.side === 'BUY' ? 'USDC' : decision.symbol;
      const toAsset = decision.side === 'BUY' ? decision.symbol : 'USDC';

      const result = await this.walletService.executeTrade(
        agent.userId,
        fromAsset,
        toAsset,
        decision.amount,
        tradeType
      );

      // Ensure we always return an object with success property
      if (result && typeof result === 'object' && 'success' in result) {
        return result;
      }
      
      // Default successful result if CDP service doesn't return proper format
      return { 
        success: true, 
        transactionHash: result?.transactionHash || 'demo-tx',
        amount: decision.amount,
        symbol: decision.symbol,
        side: decision.side
      };
    } catch (error) {
      logger.error('Trade execution failed', { 
        agentId: agent.id, 
        symbol: decision.symbol, 
        side: decision.side,
        error 
      });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Trade execution failed' 
      };
    }
  }

  /**
   * Calculate appropriate trade amount based on risk settings
   */
  private calculateTradeAmount(agent: AgentConfig, decision: TradeDecision): number {
    const riskMultiplier = agent.riskLevel === 'low' ? 0.1 : 
                          agent.riskLevel === 'medium' ? 0.2 : 0.3;
    
    const confidenceAdjustment = decision.confidence;
    const baseAmount = agent.maxTradeSize * riskMultiplier * confidenceAdjustment;
    
    return Math.min(baseAmount, agent.maxTradeSize);
  }

  /**
   * Start periodic execution for an agent
   */
  private startAgentExecution(agent: AgentConfig): void {
    // Clear existing timer if any
    const existingTimer = this.executionTimers.get(agent.id);
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    // Set new execution timer
    const timer = setInterval(async () => {
      try {
        await this.executeAgentDecision(agent.id);
      } catch (error) {
        logger.error('Agent execution timer error', { agentId: agent.id, error });
      }
    }, agent.tradingInterval);

    this.executionTimers.set(agent.id, timer);
    logger.info('Agent execution timer started', { 
      agentId: agent.id, 
      interval: agent.tradingInterval 
    });
  }

  /**
   * Get agent performance metrics
   */
  async getAgentPerformance(agentId: string): Promise<any> {
    try {
      const agent = this.activeAgents.get(agentId);
      if (!agent) {
        throw new Error('Agent not found');
      }

      // Calculate performance metrics
      const balance = await this.walletService.getBalance(agent.userId);
      const totalValue = balance.reduce((sum, b) => sum + b.balanceUSD, 0);

      const metrics = {
        agentId,
        totalPortfolioValue: totalValue,
        lastExecuted: agent.lastExecuted,
        isActive: agent.enabled,
        riskLevel: agent.riskLevel,
        strategy: agent.strategy,
        maxTradeSize: agent.maxTradeSize,
        // Additional metrics would be calculated from trading history
      };

      // Store metrics on Pinata
      await this.pinataService.storePerformanceMetrics(agentId, metrics);

      return metrics;
    } catch (error) {
      logger.error('Failed to get agent performance', { agentId, error });
      throw error;
    }
  }

  /**
   * Process payment for agent query
   */
  async processAgentQuery(userId: string, agentId: string, queryType: string): Promise<any> {
    try {
      // Create payment request through x402pay
      const paymentRequest = await this.paymentService.processAgentQuery(userId, agentId, queryType);
      
      logger.info('Agent query payment processed', { 
        userId, 
        agentId, 
        queryType,
        paymentId: paymentRequest.id 
      });
      
      return paymentRequest;
    } catch (error) {
      logger.error('Failed to process agent query payment', { userId, agentId, queryType, error });
      throw error;
    }
  }

  /**
   * Validate agent configuration
   */
  private validateAgentConfig(config: AgentConfig): void {
    if (!config.id || !config.userId || !config.name) {
      throw new Error('Missing required agent configuration fields');
    }
    
    if (config.maxTradeSize <= 0) {
      throw new Error('Max trade size must be positive');
    }
    
    if (!config.assets || config.assets.length === 0) {
      throw new Error('At least one asset must be specified');
    }
    
    if (config.tradingInterval < 60000) { // Minimum 1 minute
      throw new Error('Trading interval must be at least 1 minute');
    }
  }

  /**
   * Get all active agents
   */
  getActiveAgents(): AgentConfig[] {
    return Array.from(this.activeAgents.values());
  }
} 
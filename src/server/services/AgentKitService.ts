import { config } from '../config';
import { logger } from '../utils/logger';
import LangChainService from './LangChainService';

// AgentKit is mandatory in production. Fail fast if it can't be resolved so the
// container never boots half-configured.
let CdpWalletProvider: any;
let SwapAction: any;
let GetBalancesAction: any;
let TransferAction: any;
let DeployContractAction: any;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const agentkit = require('@coinbase/agentkit');
  CdpWalletProvider = agentkit.CdpWalletProvider;
  SwapAction = agentkit.actions?.SwapAction ?? agentkit.SwapAction;
  GetBalancesAction = agentkit.actions?.GetBalancesAction ?? agentkit.GetBalancesAction;
  TransferAction = agentkit.actions?.TransferAction ?? agentkit.TransferAction;
  DeployContractAction = agentkit.actions?.DeployContractAction ?? agentkit.DeployContractAction;
} catch (err) {
  logger.error('❌ @coinbase/agentkit is not installed or failed to load.', { err });
  throw new Error('AgentKit dependency missing. Install @coinbase/agentkit and its peer deps before starting the server.');
}

export interface Balance {
  asset: string;
  amount: string;
  amountUSD?: number;
}

export interface AgentKitConfig {
  name: string;
  strategy: string;
  riskLevel: 'low' | 'medium' | 'high';
  maxTradeSize: number;
  tradingPairs: string[];
  enabled: boolean;
}

export interface AgentKitAgent {
  id: string;
  config: AgentKitConfig;
  walletProvider: any;
  langChainService: LangChainService;
  status: 'active' | 'paused' | 'stopped';
  lastExecution?: Date;
  performance?: any;
}

class AgentKitService {
  private walletProvider: any;
  private langChainService: LangChainService;
  private agents: Map<string, AgentKitAgent> = new Map();

  constructor() {
    // All required credentials are validated in ../config. If we reach this
    // point, they are present.
    this.walletProvider = new CdpWalletProvider({
      apiKeyName: config.cdp.apiKeyId,
      privateKey: config.cdp.apiKeySecret,
      network: config.cdp.network ?? 'base-sepolia',
    });

    this.langChainService = new LangChainService();
    
    logger.info('✅ AgentKit service initialized with LangChain integration');
  }

  /* ------------------------------------------------------------------ */
  /*                               Balance                              */
  /* ------------------------------------------------------------------ */
  async getBalances(): Promise<Balance[]> {
    const action = new GetBalancesAction(this.walletProvider);
    const sdkBalances = await action.run();

    return sdkBalances.map((b: any) => ({
      asset: b.assetId ?? b.asset ?? 'UNKNOWN',
      amount: b.amount,
    }));
  }

  /* ------------------------------------------------------------------ */
  /*                                 Swap                               */
  /* ------------------------------------------------------------------ */
  async swap(fromAsset: string, toAsset: string, amount: string): Promise<{ success: boolean; transactionHash: string }> {
    const action = new SwapAction(this.walletProvider);
    const tx = await action.run({ fromAsset, toAsset, amount });

    return {
      success: true,
      transactionHash: tx.hash ?? tx,
    };
  }

  /* ------------------------------------------------------------------ */
  /*                               Transfer                             */
  /* ------------------------------------------------------------------ */
  async transfer(toAddress: string, asset: string, amount: string): Promise<{ success: boolean; transactionHash: string }> {
    const action = new TransferAction(this.walletProvider);
    const tx = await action.run({ toAddress, asset, amount });

    return {
      success: true,
      transactionHash: tx.hash ?? tx,
    };
  }

  /* ------------------------------------------------------------------ */
  /*                            Agent Management                        */
  /* ------------------------------------------------------------------ */
  async createAgent(config: AgentKitConfig): Promise<AgentKitAgent> {
    const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const agent: AgentKitAgent = {
      id: agentId,
      config,
      walletProvider: this.walletProvider,
      langChainService: this.langChainService,
      status: 'active',
    };

    this.agents.set(agentId, agent);
    logger.info('Created new AgentKit agent', { agentId, config: config.name });
    
    return agent;
  }

  async executeAgent(agentId: string, marketData: any): Promise<any> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (agent.status !== 'active') {
      logger.warn('Agent is not active', { agentId, status: agent.status });
      return null;
    }

    try {
      // Get current balance
      const balances = await this.getBalances();
      const usdcBalance = balances.find(b => b.asset === 'USDC')?.amount || '0';
      const portfolioBalance = parseFloat(usdcBalance);

      // Use LangChain to make trading decision
      const decision = await agent.langChainService.makeTradingDecision(
        agentId,
        agent.config.tradingPairs[0], // For now, use first trading pair
        marketData,
        portfolioBalance
      );

      // Execute trade if decision is to buy or sell
      if (decision.action !== 'hold' && decision.amount > 0) {
        const tradeResult = await this.executeTrade(agent, decision);
        
        // Update agent performance
        agent.lastExecution = new Date();
        agent.performance = {
          ...agent.performance,
          lastTrade: tradeResult,
          totalTrades: (agent.performance?.totalTrades || 0) + 1,
        };

        return tradeResult;
      }

      return { action: 'hold', reason: decision.reasoning };
    } catch (error) {
      logger.error('Agent execution failed', { agentId, error });
      throw error;
    }
  }

  private async executeTrade(agent: AgentKitAgent, decision: any): Promise<any> {
    try {
      if (decision.action === 'buy') {
        // For buying, we need to swap USDC to the target asset
        const swapResult = await this.swap(
          'USDC',
          decision.symbol,
          decision.amount.toString()
        );
        
        return {
          type: 'buy',
          symbol: decision.symbol,
          amount: decision.amount,
          transactionHash: swapResult.transactionHash,
          confidence: decision.confidence,
          reasoning: decision.reasoning,
        };
      } else if (decision.action === 'sell') {
        // For selling, we need to swap the asset to USDC
        const swapResult = await this.swap(
          decision.symbol,
          'USDC',
          decision.amount.toString()
        );
        
        return {
          type: 'sell',
          symbol: decision.symbol,
          amount: decision.amount,
          transactionHash: swapResult.transactionHash,
          confidence: decision.confidence,
          reasoning: decision.reasoning,
        };
      }
    } catch (error) {
      logger.error('Trade execution failed', { agentId: agent.id, decision, error });
      throw error;
    }
  }

  async getAgent(agentId: string): Promise<AgentKitAgent | null> {
    return this.agents.get(agentId) || null;
  }

  async getAllAgents(): Promise<AgentKitAgent[]> {
    return Array.from(this.agents.values());
  }

  async updateAgentStatus(agentId: string, status: 'active' | 'paused' | 'stopped'): Promise<void> {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = status;
      logger.info('Updated agent status', { agentId, status });
    }
  }

  async deleteAgent(agentId: string): Promise<void> {
    const deleted = this.agents.delete(agentId);
    if (deleted) {
      logger.info('Deleted agent', { agentId });
    }
  }

  /* ------------------------------------------------------------------ */
  /*                            Advanced Features                       */
  /* ------------------------------------------------------------------ */
  async deploySmartContract(contractName: string, constructorArgs: any[]): Promise<{ success: boolean; contractAddress: string }> {
    try {
      const action = new DeployContractAction(this.walletProvider);
      const result = await action.run({ contractName, constructorArgs });

      return {
        success: true,
        contractAddress: result.address || result.contractAddress,
      };
    } catch (error) {
      logger.error('Smart contract deployment failed', { contractName, error });
      throw error;
    }
  }

  async createCustomAction(actionName: string, actionConfig: any): Promise<any> {
    try {
      // Create a custom action using AgentKit's action framework
      const customAction = {
        name: actionName,
        config: actionConfig,
        execute: async (params: any) => {
          // Execute the custom action based on configuration
          switch (actionName) {
            case 'portfolio_rebalance':
              return await this.executePortfolioRebalance(params);
            case 'risk_management':
              return await this.executeRiskManagement(params);
            case 'yield_optimization':
              return await this.executeYieldOptimization(params);
            default:
              throw new Error(`Unknown custom action: ${actionName}`);
          }
        },
        validate: (params: any) => {
          // Validate action parameters
          if (!params || typeof params !== 'object') {
            throw new Error('Invalid parameters for custom action');
          }
          return true;
        }
      };

      logger.info('Created custom action', { actionName, actionConfig });
      
      return {
        name: actionName,
        config: actionConfig,
        status: 'created',
        action: customAction
      };
    } catch (error) {
      logger.error('Failed to create custom action', { actionName, error });
      throw error;
    }
  }

  private async executePortfolioRebalance(params: any): Promise<any> {
    const { targetAllocations, tolerance } = params;
    
    // Get current portfolio
    const balances = await this.getBalances();
    const totalValue = balances.reduce((sum, balance) => sum + (balance.amountUSD || 0), 0);
    
    // Calculate rebalancing trades
    const trades: Array<{asset: string; action: string; amount: number}> = [];
    for (const [asset, targetAllocation] of Object.entries(targetAllocations)) {
      const currentBalance = balances.find(b => b.asset === asset);
      const currentAllocation = currentBalance ? (currentBalance.amountUSD || 0) / totalValue : 0;
      const targetValue = totalValue * (targetAllocation as number);
      
      if (Math.abs(currentAllocation - (targetAllocation as number)) > tolerance) {
        const tradeAmount = targetValue - (currentBalance?.amountUSD || 0);
        if (Math.abs(tradeAmount) > 10) { // Minimum trade size
          trades.push({
            asset,
            action: tradeAmount > 0 ? 'buy' : 'sell',
            amount: Math.abs(tradeAmount)
          });
        }
      }
    }
    
    return { trades, totalValue };
  }

  private async executeRiskManagement(params: any): Promise<any> {
    const { maxDrawdown, stopLossPercent: _stopLossPercent } = params;
    
    // Get current portfolio performance
    const balances = await this.getBalances();
    const totalValue = balances.reduce((sum, balance) => sum + (balance.amountUSD || 0), 0);
    
    // Calculate risk metrics
    const riskMetrics = {
      totalValue,
      maxDrawdown: 0, // Would be calculated from historical data
      stopLossTriggered: false,
      recommendations: [] as string[]
    };
    
    // Implement risk management logic
    if (riskMetrics.maxDrawdown > maxDrawdown) {
      riskMetrics.recommendations.push('Reduce position sizes to limit drawdown');
    }
    
    return riskMetrics;
  }

  private async executeYieldOptimization(params: any): Promise<any> {
    const { targetYield, riskTolerance } = params;
    
    // Analyze current yield opportunities
    const opportunities = await this.analyzeYieldOpportunities();
    
    // Filter opportunities based on risk tolerance
    const suitableOpportunities = opportunities.filter(opp => 
      opp.riskLevel <= riskTolerance && opp.apy >= targetYield
    );
    
    return {
      opportunities: suitableOpportunities,
      recommendations: suitableOpportunities.map(opp => ({
        protocol: opp.protocol,
        action: 'allocate',
        amount: opp.recommendedAllocation,
        expectedYield: opp.apy
      }))
    };
  }

  private async analyzeYieldOpportunities(): Promise<any[]> {
    // This would integrate with DeFi protocols to find yield opportunities
    // For now, return a structured response
    return [
      {
        protocol: 'Aave',
        asset: 'USDC',
        apy: 4.2,
        riskLevel: 1,
        recommendedAllocation: 1000
      },
      {
        protocol: 'Compound',
        asset: 'USDC', 
        apy: 3.8,
        riskLevel: 1,
        recommendedAllocation: 800
      }
    ];
  }

  /* ------------------------------------------------------------------ */
  /*                            Monitoring & Analytics                  */
  /* ------------------------------------------------------------------ */
  async getAgentPerformance(agentId: string): Promise<any> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    return {
      agentId,
      config: agent.config,
      status: agent.status,
      lastExecution: agent.lastExecution,
      performance: agent.performance,
      totalTrades: agent.performance?.totalTrades || 0,
      successRate: agent.performance?.successRate || 0,
    };
  }

  async getSystemHealth(): Promise<any> {
    const activeAgents = Array.from(this.agents.values()).filter(a => a.status === 'active');
    
    return {
      totalAgents: this.agents.size,
      activeAgents: activeAgents.length,
      pausedAgents: Array.from(this.agents.values()).filter(a => a.status === 'paused').length,
      stoppedAgents: Array.from(this.agents.values()).filter(a => a.status === 'stopped').length,
      walletProvider: this.walletProvider ? 'connected' : 'disconnected',
      langChainService: this.langChainService ? 'initialized' : 'not initialized',
    };
  }
}

const agentKitService = new AgentKitService();
export default agentKitService; 
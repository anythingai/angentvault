import { BedrockService } from '../services/BedrockService';
import { CDPWalletService } from '../services/CDPWalletService';
import { X402PayService } from '../services/X402PayService';
import { db } from '../database';
import { logger } from '../utils/logger';
import { AgentStatus, TradeStatus, PaymentStatus } from '../../types';
import { GraphQLScalarType, Kind } from 'graphql';

const bedrockService = new BedrockService();
const walletService = new CDPWalletService();
const paymentService = new X402PayService();

// Modify the JSON scalar implementation
function parseAST(ast: any): any {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
    case Kind.FLOAT:
      return parseFloat(ast.value);
    case Kind.OBJECT: {
      const value: Record<string, any> = {};
      ast.fields.forEach((field: any) => {
        value[field.name.value] = parseAST(field.value);
      });
      return value;
    }
    case Kind.LIST:
      return ast.values.map((n: any) => parseAST(n));
    default:
      return null;
  }
}

const GraphQLJSON = new GraphQLScalarType({
  name: 'JSON',
  description: 'Arbitrary JSON value',
  parseValue(value: unknown) {
    return value as any;
  },
  serialize(value: unknown) {
    return value as any;
  },
  parseLiteral(ast) {
    return parseAST(ast);
  },
});

export const resolvers = {
  JSON: GraphQLJSON,
  DateTime: new GraphQLScalarType({
    name: 'DateTime',
    description: 'Custom DateTime scalar type',
    parseValue(value: unknown) {
      return new Date(value as string | number | Date);
    },
    serialize(value: unknown) {
      return (value as Date).toISOString();
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.STRING) {
        return new Date(ast.value);
      }
      return null;
    },
  }),
  Query: {
    // Get all agents for a user
    agents: async (_: any, __: any, context: any) => {
      try {
        const userId = context.user?.id;
        if (!userId) throw new Error('Not authenticated');

        return await db.agent.findMany({
          where: { ownerId: userId },
          orderBy: { createdAt: 'desc' },
        });
      } catch (error) {
        logger.error('Failed to fetch agents:', error);
        throw error;
      }
    },

    // Get specific agent
    agent: async (_: any, { id }: { id: string }, context: any) => {
      try {
        const userId = context.user?.id;
        if (!userId) throw new Error('Not authenticated');

        const agent = await db.agent.findFirst({
          where: { id, ownerId: userId },
        });

        if (!agent) throw new Error('Agent not found');
        return agent;
      } catch (error) {
        logger.error('Failed to fetch agent:', error);
        throw error;
      }
    },

    // Get user portfolio
    portfolio: async (_: any, __: any, context: any) => {
      try {
        const userId = context.user?.id;
        if (!userId) throw new Error('Not authenticated');

        const wallets = await db.wallet.findMany({
          where: { userId, isActive: true },
        });

        const trades = await db.trade.findMany({
          where: {
            agent: { ownerId: userId },
            status: TradeStatus.EXECUTED,
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });

        return {
          wallets,
          trades,
          totalValue: 0, // Will be calculated from actual balances
          performance: {
            totalReturn: 0,
            dailyReturn: 0,
            weeklyReturn: 0,
          },
        };
      } catch (error) {
        logger.error('Failed to fetch portfolio:', error);
        throw error;
      }
    },

    // Get market data
    marketData: async (_: any, { symbol }: { symbol: string }, { dataSources }: any) => {
      return dataSources.marketDataAPI.getMarketData(symbol);
    },

    // Get current user
    me: async (_: any, __: any, context: any) => {
      try {
        const userId = context.user?.id;
        if (!userId) throw new Error('Not authenticated');

        return await db.user.findUnique({
          where: { id: userId },
        });
      } catch (error) {
        logger.error('Failed to fetch user:', error);
        throw error;
      }
    },

    agentDecision: async (_: any, { symbol }: { symbol: string }, { services }: any) => {
      const decision = await services.bedrock.generateAgentDecision(symbol);
      // Bedrock returns full message; try to find "simple_decision" tool output if present
      const content = decision?.tool ?? decision;
      return {
        symbol: content.symbol,
        side: content.side,
        confidence: content.confidence,
      };
    },
  },

  Mutation: {
    // Create new agent
    createAgent: async (_: any, { input }: any, context: any) => {
      try {
        const userId = context.user?.id;
        if (!userId) throw new Error('Not authenticated');

        const agent = await db.agent.create({
          data: {
            name: input.name,
            description: input.description,
            ownerId: userId,
            config: JSON.stringify(input.config),
            status: AgentStatus.PAUSED,
          },
        });

        logger.info('Agent created:', { agentId: agent.id, userId });
        return agent;
      } catch (error) {
        logger.error('Failed to create agent:', error);
        throw error;
      }
    },

    // Deploy agent (activate)
    deployAgent: async (_: any, { id }: { id: string }, context: any) => {
      try {
        const userId = context.user?.id;
        if (!userId) throw new Error('Not authenticated');

        const agent = await db.agent.findFirst({
          where: { id, ownerId: userId },
        });

        if (!agent) throw new Error('Agent not found');

        // Update agent status to active
        const updatedAgent = await db.agent.update({
          where: { id },
          data: { status: AgentStatus.ACTIVE },
        });

        // Perform initial market analysis
        const marketAnalysis = await bedrockService.analyzeMarketSentiment({
          symbols: ['BTC', 'ETH', 'USDC'],
          timeframe: '1h',
        });

        // Store analysis result
        await db.aiAnalysis.create({
          data: {
            agentId: id,
            userId,
            type: 'MARKET_SENTIMENT',
            input: JSON.stringify({ symbols: ['BTC', 'ETH', 'USDC'] }),
            output: JSON.stringify(marketAnalysis),
            confidence: 0.8,
            reasoning: 'Initial market analysis for agent deployment',
          },
        });

        logger.info('Agent deployed:', { agentId: id, userId });
        
        return {
          success: true,
          agent: updatedAgent,
          message: 'Agent deployed successfully',
        };
      } catch (error) {
        logger.error('Failed to deploy agent:', error);
        throw error;
      }
    },

    // Execute trade
    executeTrade: async (_: any, { input }: any, { services, user }: any) => {
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { fromAsset, toAsset, amount, type } = input;

      const result = await services.wallet.executeTrade(
        user.id,
        fromAsset,
        toAsset,
        amount,
        type
      );

      // Persist trade to database
      const trade = await db.trade.create({
        data: {
          agentId: input.agentId ?? '',
          type,
          symbol: `${fromAsset}/${toAsset}`,
          amount,
          price: 0,
          status: TradeStatus.EXECUTED,
          txHash: result.transactionHash,
        },
      });

      // Pin trade record to IPFS via Pinata
      try {
        const pinRes = await services.pinata.uploadJSON({
          trade,
          executedAt: new Date().toISOString(),
        }, `trade-${trade.id}.json`);

        await db.ipfsData.create({
          data: {
            agentId: trade.agentId,
            hash: pinRes.ipfsHash,
            type: 'TRADING_HISTORY',
            fileName: `trade-${trade.id}.json`,
          },
        });
      } catch (pinErr) {
        logger.error('Failed to pin trade to Pinata', pinErr);
      }

      return trade;
    },

    // Process payment
    processPayment: async (_: any, { input }: any, { services, user }: any) => {
      if (!user) {
        throw new Error('Not authenticated');
      }

      return services.x402pay.createPaymentRequest(input);
    },
  },

  // Subscriptions for real-time updates
  Subscription: {
    agentStatusUpdated: {
      subscribe: () => {
        // WebSocket subscription implementation
        // This would use a pub/sub system like Redis
        return {
          [Symbol.asyncIterator]: async function* () {
            // Mock implementation for now
            yield { agentStatusUpdated: { id: '1', status: 'active' } };
          },
        };
      },
    },

    tradeExecuted: {
      subscribe: () => {
        return {
          [Symbol.asyncIterator]: async function* () {
            // Mock implementation for now
            yield { tradeExecuted: { id: '1', status: 'executed' } };
          },
        };
      },
    },
  },
}; 
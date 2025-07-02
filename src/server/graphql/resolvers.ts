import { PrismaClient } from '@prisma/client';
import { CDPWalletService } from '../services/CDPWalletService';
import { X402PayService } from '../services/X402PayService';
import { MarketDataService } from '../services/MarketDataService';
import { AgentOrchestrator } from '../services/AgentOrchestrator';
import { BedrockService } from '../services/BedrockService';
import { logger } from '../utils/logger';
import { GraphQLScalarType, Kind } from 'graphql';
import { websocketHandler } from '../websocket/handler';

const db = new PrismaClient();
const orchestrator = new AgentOrchestrator(websocketHandler);

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

const resolvers = {
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
    // Simple health check query
    hello: () => {
      return 'AgentVault GraphQL API is running!';
    },

    // Test CDP connection
    testCDPConnection: async () => {
      try {
        const walletService = new CDPWalletService();
        const result = await walletService.testConnection();
        
        return {
          success: result.success,
          message: result.message,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return {
          success: false,
          message: `CDP test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date().toISOString()
        };
      }
    },

    // Basic agent query
    agents: async () => {
      try {
        const agents = await db.agent.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' }
        });

        return agents.map(agent => ({
          ...agent,
          config: agent.strategy || {},
          metadata: agent.riskParameters || {}
        }));
      } catch (error) {
        logger.error('Failed to fetch agents:', error);
        return [];
      }
    },

    // Agent queries
    agent: async (_: any, { id }: { id: string }, context: any) => {
      try {
        const userId = context.user?.id;
        if (!userId) throw new Error('Authentication required');

        const agent = await db.agent.findFirst({
          where: { id, userId },
          include: {
            trades: {
              orderBy: { executedAt: 'desc' }
            }
          }
        });

        if (!agent) throw new Error('Agent not found');

        return {
          ...agent,
          config: agent.strategy || {},
          metadata: agent.riskParameters || {},
          performance: agent.performance || {
            totalTrades: agent.trades?.length || 0,
            winRate: agent.trades?.length ? 
              (agent.trades.filter((t: any) => t.status === 'success').length / agent.trades.length) * 100 : 0,
            totalReturn: agent.trades?.reduce((sum: number, t: any) => sum + (t.usdValue || 0), 0) || 0
          }
        };
      } catch (error) {
        logger.error('Failed to fetch agent:', error);
        throw error;
      }
    },

    // Market data queries
    marketData: async (_: any, { symbols }: { symbols: string[] }) => {
      try {
        const marketService = new MarketDataService();
        const data = await marketService.getMarketData(symbols);
        return data;
      } catch (error) {
        logger.error('Failed to fetch market data:', error);
        return [];
      }
    },

    // Portfolio query
    portfolio: async (_: any, __: any, context: any) => {
      try {
        const userId = context.user?.id;
        if (!userId) throw new Error('Authentication required');

        const walletService = new CDPWalletService();
        const balances = await walletService.getBalance(userId);

        const totalValue = balances.reduce((sum, b) => sum + b.balanceUSD, 0);
        const assets = balances.map(b => ({
          symbol: b.asset,
          amount: b.balance,
          value: b.balanceUSD,
          change24h: 0 // Would require price history tracking in production
        }));

        return {
          totalValue,
          totalPnL: 0,
          pnlPercentage: 0,
          assets
        };
      } catch (error) {
        logger.error('Failed to fetch portfolio:', error);
        return {
          totalValue: 0,
          totalPnL: 0,
          pnlPercentage: 0,
          assets: []
        };
      }
    },

    // --------------------------------------------------
    // NEW: Return the current authenticated user (for "me" query)
    // --------------------------------------------------
    me: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      // In most cases we just need the user that auth middleware already attached.
      // If we ever need fresher data we can re-fetch from DB, but this suffices.
      return {
        id: context.user.id,
        email: context.user.email || '',
        name: context.user.name || '',
        walletAddress: context.user.walletAddress || '',
        subscription: context.user.subscription || 'basic',
        isVerified: true,
        createdAt: new Date(),
      };
    },

    // --------------------------------------------------
    // NEW: Generate a minimal trading decision via Bedrock (agentDecision query)
    // --------------------------------------------------
    agentDecision: async (_: any, { symbol }: { symbol: string }, context: any) => {
      try {
        const bedrock: BedrockService = context.services?.bedrock || new BedrockService();
        const decision = await bedrock.generateAgentDecision(symbol);
        return {
          symbol: decision.symbol || symbol,
          side: decision.side || 'HOLD',
          confidence: decision.confidence ?? 0.5,
        };
      } catch (error) {
        logger.error('Failed to generate agent decision:', error);
        throw error;
      }
    },
  },

  Mutation: {
    // Simple agent creation
    createAgent: async (_: any, { input }: any) => {
      try {
        const agent = await db.agent.create({
          data: {
            name: input.name,
            description: input.description,
            userId: input.ownerId,
            strategy: JSON.stringify(input.config || {}),
            riskParameters: JSON.stringify(input.metadata || {}),
            status: 'active'
          }
        });

        logger.info('Agent created successfully', { agentId: agent.id });

        return {
          ...agent,
          config: typeof agent.strategy === 'string' ? JSON.parse(agent.strategy) : {},
          metadata: typeof agent.riskParameters === 'string' ? JSON.parse(agent.riskParameters) : {}
        };
      } catch (error) {
        logger.error('Failed to create agent:', error);
        throw error;
      }
    },

    // Start agent
    startAgent: async (_: any, { id }: { id: string }, context: any) => {
      try {
        const userId = context.user?.id;
        if (!userId) throw new Error('Authentication required');

        const agent = await db.agent.findFirst({
          where: { id, userId }
        });

        if (!agent) throw new Error('Agent not found');

        await orchestrator.startAgent(id);

        const updatedAgent = await db.agent.update({
          where: { id },
          data: { status: 'active' }
        });

        return {
          ...updatedAgent,
          config: typeof updatedAgent.strategy === 'string' ? JSON.parse(updatedAgent.strategy) : {},
          metadata: typeof updatedAgent.riskParameters === 'string' ? JSON.parse(updatedAgent.riskParameters) : {},
          performance: typeof updatedAgent.performance === 'string' ? JSON.parse(updatedAgent.performance) : {
            totalTrades: 0,
            winRate: 0,
            totalReturn: 0
          }
        };
      } catch (error) {
        logger.error('Failed to start agent:', error);
        throw error;
      }
    },

    // Stop agent
    stopAgent: async (_: any, { id }: { id: string }, context: any) => {
      try {
        const userId = context.user?.id;
        if (!userId) throw new Error('Authentication required');

        const agent = await db.agent.findFirst({
          where: { id, userId }
        });

        if (!agent) throw new Error('Agent not found');

        await orchestrator.stopAgent(id);

        const updatedAgent = await db.agent.update({
          where: { id },
          data: { status: 'paused' }
        });
        
        return {
          ...updatedAgent,
          config: typeof updatedAgent.strategy === 'string' ? JSON.parse(updatedAgent.strategy) : {},
          metadata: typeof updatedAgent.riskParameters === 'string' ? JSON.parse(updatedAgent.riskParameters) : {},
          performance: typeof updatedAgent.performance === 'string' ? JSON.parse(updatedAgent.performance) : {
            totalTrades: 0,
            winRate: 0,
            totalReturn: 0
          }
        };
      } catch (error) {
        logger.error('Failed to stop agent:', error);
        throw error;
      }
    },

    // Execute payment
    executePayment: async (_: any, { agentId, amount }: { agentId: string, amount: number }, context: any) => {
      try {
        const userId = context.user?.id;
        if (!userId) throw new Error('Authentication required');

        const paymentService = new X402PayService();
        const payment = await paymentService.processAgentQuery(userId, agentId, 'trade_execution');

        return {
          id: payment.id,
          amount,
          status: 'COMPLETED',
          transactionHash: payment.transactionHash,
          createdAt: new Date()
        };
      } catch (error) {
        logger.error('Failed to execute payment:', error);
        throw error;
      }
    },

    // --------------------------------------------------
    // NEW: Deploy an agent (start it via AgentOrchestrator)
    // --------------------------------------------------
    deployAgent: async (_: any, { id }: { id: string }) => {
      try {
        await orchestrator.startAgent(id);

        return {
          success: true,
          agent: { id },
          message: 'Agent deployment initiated successfully',
        };
      } catch (error) {
        logger.error('Failed to deploy agent:', error);
        return {
          success: false,
          agent: { id },
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },

    // --------------------------------------------------
    // NEW: Process an arbitrary payment using x402pay
    // --------------------------------------------------
    processPayment: async (_: any, { input }: any) => {
      try {
        const paymentService = new X402PayService();
        const paymentRequest = await paymentService.createPaymentRequest({
          amount: input.amount,
          currency: input.currency,
          recipient: input.recipient,
          metadata: {
            type: input.type,
            ...input.metadata,
          },
        });

        return {
          id: paymentRequest.id || 'payment-request',
          userId: 'system',
          amount: input.amount,
          currency: input.currency,
          type: input.type,
          status: 'PENDING',
          transactionHash: paymentRequest.transactionHash || null,
          createdAt: new Date(),
        };
      } catch (error) {
        logger.error('Failed to process payment:', error);
        throw error;
      }
    },
  },
}; 

export default resolvers; 
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { CDPWalletService } from '../services/CDPWalletService';
import { AgentOrchestrator } from '../services/AgentOrchestrator';
import { logger } from '../utils/logger';

export default function agentRoutes(agentOrchestrator: AgentOrchestrator) {
  const router = Router();
  const prisma = new PrismaClient();
  const cdpWalletService = new CDPWalletService();

  // Get all agents for the authenticated user
  router.get('/agents', authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const agents = await prisma.agent.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ agents });
    } catch (error) {
      logger.error('Failed to fetch agents:', error);
      res.status(500).json({ error: 'Failed to fetch agents' });
    }
  });

  // Get a single agent by ID
  router.get('/agents/:id', authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.id;
      const agentId = req.params.id;

      const agent = await prisma.agent.findFirst({
        where: {
          id: agentId,
          userId,
        },
        include: {
          trades: {
            orderBy: { executedAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      res.json({ agent });
    } catch (error) {
      logger.error('Failed to fetch agent:', error);
      res.status(500).json({ error: 'Failed to fetch agent' });
    }
  });

  // Create a new agent
  router.post('/agents', authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { name, description, strategy, riskParameters } = req.body;

      // Validate input
      if (!name || !strategy || !riskParameters) {
        return res.status(400).json({ 
          error: 'Missing required fields: name, strategy, riskParameters' 
        });
      }

      // Create agent in database
      const agent = await prisma.agent.create({
        data: {
          userId,
          name,
          description,
          strategy,
          riskParameters,
          status: 'active',
          performance: JSON.stringify({
            totalReturn: 0,
            winRate: 0,
            totalTrades: 0,
            profitableTrades: 0,
          }),
        },
      });

      // Register agent with orchestrator
      await agentOrchestrator.registerAgent(agent.id, {
        id: agent.id,
        name: agent.name,
        userId,
        strategy,
        riskParameters,
        maxTradeSize: 1000, // Default value
        tradingInterval: 300000, // 5 minutes default
        assets: ['BTC/USD'], // Default asset
        enabled: true,
      });

      logger.info('Agent created successfully', { 
        agentId: agent.id, 
        userId 
      });

      res.status(201).json({ agent });
    } catch (error) {
      logger.error('Failed to create agent:', error);
      res.status(500).json({ error: 'Failed to create agent' });
    }
  });

  // Update agent configuration
  router.put('/agents/:id', authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.id;
      const agentId = req.params.id;
      const { name, description, strategy, riskParameters, status } = req.body;

      // Verify ownership
      const existingAgent = await prisma.agent.findFirst({
        where: { id: agentId, userId },
      });

      if (!existingAgent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Update agent
      const agent = await prisma.agent.update({
        where: { id: agentId },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(strategy && { strategy }),
          ...(riskParameters && { riskParameters }),
          ...(status && { status }),
        },
      });

      // Update orchestrator if strategy or risk parameters changed
      if (strategy || riskParameters) {
        await agentOrchestrator.updateAgent(agentId, {
          strategy: strategy || existingAgent.strategy,
          riskParameters: riskParameters || existingAgent.riskParameters,
        });
      }

      if (status) {
        if (status === 'active') {
          await agentOrchestrator.startAgent(agentId);
        } else if (status === 'paused' || status === 'stopped') {
          await agentOrchestrator.stopAgent(agentId);
        }
      }

      res.json({ agent });
    } catch (error) {
      logger.error('Failed to update agent:', error);
      res.status(500).json({ error: 'Failed to update agent' });
    }
  });

  // Delete an agent
  router.delete('/agents/:id', authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.id;
      const agentId = req.params.id;

      // Verify ownership
      const agent = await prisma.agent.findFirst({
        where: { id: agentId, userId },
      });

      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Stop agent in orchestrator
      await agentOrchestrator.stopAgent(agentId);

      // Delete from database
      await prisma.agent.delete({
        where: { id: agentId },
      });

      res.json({ success: true });
    } catch (error) {
      logger.error('Failed to delete agent:', error);
      res.status(500).json({ error: 'Failed to delete agent' });
    }
  });

  // Get recent trades for a specific agent
  router.get('/agents/:id/trades', authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.id;
      const agentId = req.params.id;

      // Verify ownership
      const agent = await prisma.agent.findFirst({
        where: { id: agentId, userId },
      });

      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      const trades = await prisma.trade.findMany({
        where: {
          agentId: agentId,
        },
        orderBy: {
          executedAt: 'desc',
        },
        take: 20, // Limit to the last 20 trades
      });

      res.json({ trades });
    } catch (error) {
      logger.error('Failed to fetch recent trades for agent:', error);
      res.status(500).json({ error: 'Failed to fetch recent trades' });
    }
  });

  // Get monetization data for a specific agent
  router.get('/agents/:id/monetization', authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.id;
      const agentId = req.params.id;

      // Verify ownership
      const agent = await prisma.agent.findFirst({
        where: { id: agentId, userId },
      });

      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      const payments = await prisma.payment.findMany({
        where: {
          agentId: agentId,
          status: 'completed',
        },
      });

      const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const queriesProcessed = payments.length;

      // Calculate unique subscriber count based on payments
      const uniquePayers = await prisma.payment.findMany({
        where: {
          agentId: agentId,
          status: 'completed',
        },
        select: {
          userId: true,
        },
        distinct: ['userId'],
      });
      const subscriberCount = uniquePayers.length;
      
      const revenueThisMonth = payments
        .filter(p => new Date(p.createdAt) > new Date(new Date().setDate(new Date().getDate() - 30)))
        .reduce((sum, p) => sum + p.amount, 0);

      res.json({
        totalEarned: totalRevenue,
        queriesProcessed,
        subscriberCount,
        revenueThisMonth,
      });
    } catch (error) {
      logger.error('Failed to fetch monetization data for agent:', error);
      res.status(500).json({ error: 'Failed to fetch monetization data' });
    }
  });

  // Execute trade for an agent
  router.post('/agents/:id/trade', authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const agentId = req.params.id;
      const { fromAsset, toAsset, amount, type } = req.body;

      // Verify agent ownership
      const agent = await prisma.agent.findFirst({
        where: { id: agentId, userId },
      });

      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Get user's wallet
      const wallet = await prisma.wallet.findFirst({
        where: { userId },
      });

      if (!wallet) {
        return res.status(400).json({ error: 'No wallet found for user' });
      }

      // Execute trade through CDP Wallet
      const tradeResult = await cdpWalletService.executeTrade(
        userId,
        fromAsset,
        toAsset,
        amount,
        type
      );

      // Record trade in database
      const trade = await prisma.trade.create({
        data: {
          userId,
          agentId,
          walletId: wallet.id,
          txHash: tradeResult.transactionHash,
          fromAsset,
          toAsset,
          amount,
          price: tradeResult.price || 0,
          usdValue: tradeResult.usdValue || 0,
          type,
          status: 'success',
        },
      });

      // Update agent performance
      await updateAgentPerformance(agentId);
      
      agentOrchestrator.broadcastTradeExecution(userId, trade);

      res.json({ trade, transactionHash: tradeResult.transactionHash });
    } catch (error) {
      logger.error('Failed to execute trade:', error);
      res.status(500).json({ error: 'Failed to execute trade' });
    }
  });

  // Get agent performance metrics
  router.get('/agents/:id/performance', authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.id;
      const agentId = req.params.id;

      const agent = await prisma.agent.findFirst({
        where: { id: agentId, userId },
        include: {
          trades: {
            orderBy: { executedAt: 'desc' },
          },
        },
      });

      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Calculate performance metrics
      const totalTrades = agent.trades.length;
      const profitableTrades = agent.trades.filter(t => t.usdValue > 0).length;
      const totalVolume = agent.trades.reduce((sum, t) => sum + t.usdValue, 0);
      const avgTradeSize = totalTrades > 0 ? totalVolume / totalTrades : 0;

      const performance = {
        totalTrades,
        profitableTrades,
        winRate: totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0,
        totalVolume,
        avgTradeSize,
        last24hTrades: agent.trades.filter(t => 
          new Date(t.executedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length,
      };

      res.json({ performance });
    } catch (error) {
      logger.error('Failed to get agent performance:', error);
      res.status(500).json({ error: 'Failed to get agent performance' });
    }
  });

  // Helper function to update agent performance
  async function updateAgentPerformance(agentId: string) {
    try {
      const trades = await prisma.trade.findMany({
        where: { agentId },
      });

      const totalTrades = trades.length;
      const profitableTrades = trades.filter(t => t.usdValue > 0).length;
      const totalReturn = trades.reduce((sum, t) => sum + (t.usdValue || 0), 0);
      const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;

      const performanceData = {
        totalReturn,
        winRate,
        totalTrades,
        profitableTrades,
      };

      await prisma.agent.update({
        where: { id: agentId },
        data: {
          performance: JSON.stringify(performanceData),
        },
      });

      if (trades.length > 0) {
        agentOrchestrator.broadcastAgentUpdate(agentId, { performance: performanceData });
      }

    } catch (error) {
      logger.error('Failed to update agent performance:', error);
    }
  }

  return router;
} 
import { Router } from 'express';
import { db } from '../database';
import { logger } from '../utils/logger';
import { AgentStatus } from '../../types';

const router = Router();

// Get all agents for authenticated user
router.get('/', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const agents = await db.agent.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: agents,
    });
  } catch (error) {
    logger.error('Failed to fetch agents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agents',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get specific agent
router.get('/:id', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const agent = await db.agent.findFirst({
      where: { id, ownerId: userId },
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }

    res.json({
      success: true,
      data: agent,
    });
  } catch (error) {
    logger.error('Failed to fetch agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Create new agent
router.post('/', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const { name, description, config } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Name and description are required',
      });
    }

    const agent = await db.agent.create({
      data: {
        name,
        description,
        ownerId: userId,
        config: JSON.stringify(config || {}),
        status: AgentStatus.PAUSED,
      },
    });

    res.status(201).json({
      success: true,
      data: agent,
      message: 'Agent created successfully',
    });

    logger.info('Agent created:', { agentId: agent.id, userId });
  } catch (error) {
    logger.error('Failed to create agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create agent',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Update agent status
router.patch('/:id/status', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    // Verify agent ownership
    const agent = await db.agent.findFirst({
      where: { id, ownerId: userId },
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }

    // Update status
    const updatedAgent = await db.agent.update({
      where: { id },
      data: { status },
    });

    res.json({
      success: true,
      data: updatedAgent,
      message: `Agent status updated to ${status}`,
    });

    logger.info('Agent status updated:', { agentId: id, status, userId });
  } catch (error) {
    logger.error('Failed to update agent status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update agent status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Delete agent
router.delete('/:id', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    // Verify agent ownership
    const agent = await db.agent.findFirst({
      where: { id, ownerId: userId },
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }

    // Delete agent
    await db.agent.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Agent deleted successfully',
    });

    logger.info('Agent deleted:', { agentId: id, userId });
  } catch (error) {
    logger.error('Failed to delete agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete agent',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router; 
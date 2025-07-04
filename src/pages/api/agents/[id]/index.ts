import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../../server/utils/logger';
import { verifyToken } from '../../../../server/middleware/auth';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Verify JWT token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = await verifyToken(token);
    const userId = decoded.userId;
    const agentId = req.query.id as string;

    switch (req.method) {
      case 'GET':
        return handleGet(req, res, userId, agentId);
      case 'PUT':
        return handlePut(req, res, userId, agentId);
      case 'DELETE':
        return handleDelete(req, res, userId, agentId);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    logger.error('Agent API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, userId: string, agentId: string) {
  try {
    const agent = await prisma.agent.findFirst({
      where: { 
        id: agentId,
        userId 
      },
      include: {
        trades: {
          orderBy: { executedAt: 'desc' },
          take: 10
        }
      }
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json({ agent });
  } catch (error) {
    logger.error('Failed to fetch agent:', error);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, userId: string, agentId: string) {
  try {
    const { status, name, description, strategy, riskParameters, isPublic, pricing, tags } = req.body;

    // Verify the agent belongs to the user
    const existingAgent = await prisma.agent.findFirst({
      where: { 
        id: agentId,
        userId 
      }
    });

    if (!existingAgent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Update agent
    const updatedAgent = await prisma.agent.update({
      where: { id: agentId },
      data: {
        ...(status !== undefined && { status }),
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(strategy && { strategy: typeof strategy === 'string' ? strategy : JSON.stringify(strategy) }),
        ...(riskParameters && { riskParameters: typeof riskParameters === 'string' ? riskParameters : JSON.stringify(riskParameters) }),
        ...(isPublic !== undefined && { isPublic }),
        ...(pricing !== undefined && { pricing: typeof pricing === 'string' ? pricing : JSON.stringify(pricing) }),
        ...(tags !== undefined && { tags: typeof tags === 'string' ? tags : JSON.stringify(tags) }),
        updatedAt: new Date()
      }
    });

    res.json({ agent: updatedAgent });
  } catch (error) {
    logger.error('Failed to update agent:', error);
    res.status(500).json({ error: 'Failed to update agent' });
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, userId: string, agentId: string) {
  try {
    // Verify the agent belongs to the user
    const existingAgent = await prisma.agent.findFirst({
      where: { 
        id: agentId,
        userId 
      }
    });

    if (!existingAgent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Delete agent (cascade will handle related records)
    await prisma.agent.delete({
      where: { id: agentId }
    });

    res.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete agent:', error);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
} 
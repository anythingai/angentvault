import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../server/utils/logger';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { marketplace } = req.query;
  
  // Allow unauthenticated access for marketplace queries
  if (req.method === 'GET' && marketplace === 'true') {
    return handleGet(req, res, null);
  }

  // Require authentication for all other operations
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.slice(7);

  let userId: string;
  try {
    const decoded = (await import('jsonwebtoken')).default.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
      userId?: string;
    };
    userId = decoded.userId ?? decoded.id;
  } catch (err) {
    logger.error('JWT verification failed', err);
    return res.status(401).json({ error: 'Invalid token' });
  }

  switch (req.method) {
    case 'GET':
      return handleGet(req, res, userId);
    case 'POST':
      return handlePost(req, res, userId);
    case 'DELETE':
      return handleDelete(req, res, userId);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, userId: string | null) {
  try {
    const { marketplace } = req.query;
    
    // If marketplace query parameter is present, return only public agents
    if (marketplace === 'true') {
      const agents = await prisma.agent.findMany({
        where: { isPublic: true },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });
      
      res.json({ agents });
      return;
    }
    
    // Require authentication for user's own agents
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Return user's own agents
    const agents = await prisma.agent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ agents });
  } catch (error) {
    logger.error('Failed to fetch agents:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const { 
      name, 
      description, 
      strategy, 
      riskParameters, 
      isPublic = false, 
      pricing, 
      tags 
    } = req.body;

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
        isPublic,
        pricing: pricing ? JSON.stringify(pricing) : null,
        tags: tags ? JSON.stringify(tags) : null,
        performance: JSON.stringify({
          totalReturn: 0,
          winRate: 0,
          totalTrades: 0,
          profitableTrades: 0,
        }),
      },
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
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const { agentId } = req.query;

    if (!agentId || typeof agentId !== 'string') {
      return res.status(400).json({ error: 'Agent ID is required' });
    }

    // Check if agent belongs to user
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId },
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Delete the agent
    await prisma.agent.delete({
      where: { id: agentId },
    });

    logger.info('Agent deleted successfully', { 
      agentId, 
      userId 
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete agent:', error);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
} 
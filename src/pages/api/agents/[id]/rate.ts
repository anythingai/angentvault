import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../../server/utils/logger';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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

  const { id: agentId } = req.query;

  if (!agentId || typeof agentId !== 'string') {
    return res.status(400).json({ error: 'Agent ID is required' });
  }

  switch (req.method) {
    case 'POST':
      return handleRateAgent(req, res, userId, agentId);
    case 'GET':
      return handleGetRating(req, res, userId, agentId);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleRateAgent(req: NextApiRequest, res: NextApiResponse, userId: string, agentId: string) {
  try {
    const { rating, review } = req.body;

    // Validate rating
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be a number between 1 and 5' });
    }

    // Check if agent exists and is public
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, isPublic: true },
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found or not public' });
    }

    // Check if user has already rated this agent
    const existingRating = await prisma.agentRating.findUnique({
      where: {
        agentId_userId: {
          agentId,
          userId,
        },
      },
    });

    let agentRating;
    if (existingRating) {
      // Update existing rating
      agentRating = await prisma.agentRating.update({
        where: {
          agentId_userId: {
            agentId,
            userId,
          },
        },
        data: {
          rating,
          review: review || null,
        },
      });
    } else {
      // Create new rating
      agentRating = await prisma.agentRating.create({
        data: {
          agentId,
          userId,
          rating,
          review: review || null,
        },
      });
    }

    // Calculate new average rating for the agent
    const allRatings = await prisma.agentRating.findMany({
      where: { agentId },
      select: { rating: true },
    });

    const averageRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

    // Update agent's average rating
    await prisma.agent.update({
      where: { id: agentId },
      data: { rating: averageRating },
    });

    logger.info('Agent rated successfully', { 
      agentId, 
      userId, 
      rating,
      averageRating 
    });

    res.json({ 
      success: true, 
      rating: agentRating,
      averageRating 
    });
  } catch (error) {
    logger.error('Failed to rate agent:', error);
    res.status(500).json({ error: 'Failed to rate agent' });
  }
}

async function handleGetRating(req: NextApiRequest, res: NextApiResponse, userId: string, agentId: string) {
  try {
    // Get user's rating for this agent
    const userRating = await prisma.agentRating.findUnique({
      where: {
        agentId_userId: {
          agentId,
          userId,
        },
      },
    });

    // Get agent's average rating
    const agent = await prisma.agent.findFirst({
      where: { id: agentId },
      select: { rating: true },
    });

    res.json({ 
      success: true, 
      userRating: userRating?.rating || null,
      userReview: userRating?.review || null,
      averageRating: agent?.rating || 0
    });
  } catch (error) {
    logger.error('Failed to get rating:', error);
    res.status(500).json({ error: 'Failed to get rating' });
  }
} 
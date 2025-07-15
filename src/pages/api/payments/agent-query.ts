import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { X402PayService } from '../../../server/services/X402PayService';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../server/utils/logger';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] });
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

enum PaymentType {
  SUBSCRIPTION = 'subscription',
  AGENT_ACCESS = 'agent_access',
  QUERY_FEE = 'query_fee',
  REVENUE_SHARE = 'revenue_share',
}

enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    // Authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string; userId?: string };
    const userId = decoded.userId ?? decoded.id;

    const { agentId, queryType } = req.body;

    if (!agentId || !queryType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Agent ID and query type are required',
      });
    }

    // Verify the agent exists
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { user: true }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }

    // Initialize payment service
    const paymentService = new X402PayService();

    // Get pricing from the service
    const pricing = paymentService.getQueryPricing(queryType);

    // Check if agent is free
    let payment, paymentResult;

    if (pricing.amount === 0 || queryType === 'basic_query') {
      // For free agents, create a completed payment record without processing x402pay
      payment = await prisma.payment.create({
        data: {
          userId,
          agentId,
          amount: 0,
          currency: 'USDC',
          type: PaymentType.QUERY_FEE,
          status: PaymentStatus.COMPLETED,
          reference: `free-${Date.now()}`,
          metadata: JSON.stringify({
            agentId,
            queryType,
            free: true,
          }),
        },
      });

      paymentResult = { id: payment.reference, amount: 0, free: true };
    } else {
      // Process payment through x402pay service for paid agents
      paymentResult = await paymentService.processAgentQuery(userId, agentId, queryType);

      // Create payment record
      payment = await prisma.payment.create({
        data: {
          userId,
          agentId,
          amount: pricing.amount,
          currency: 'USDC',
          type: PaymentType.QUERY_FEE,
          status: PaymentStatus.PENDING,
          reference: paymentResult.id,
          metadata: JSON.stringify({
            agentId,
            queryType,
          }),
        },
      });
    }

    res.json({
      success: true,
      data: {
        payment,
        paymentRequest: paymentResult,
        pricing,
      },
      message: pricing.amount === 0 ? 'Free agent access granted' : 'Agent payment processed',
    });

    logger.info('Agent query payment created:', { 
      paymentId: payment.id, 
      agentId, 
      queryType,
      userId 
    });

  } catch (error) {
    logger.error('Failed to process agent query payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process agent query payment',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 
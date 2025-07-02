import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] });
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string; userId?: string };
    const userId = decoded.userId ?? decoded.id;

    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '50', 10);
    const skip = (page - 1) * limit;

    // Payments *made by* the user OR payments *earned* by the user's agents
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: {
          OR: [
            { userId },
            {
              agent: {
                userId,
              },
            },
          ],
        },
        include: {
          agent: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({
        where: {
          OR: [
            { userId },
            {
              agent: { userId },
            },
          ],
        },
      }),
    ]);

    const data = payments.map((p) => ({
      id: p.id,
      type: p.type as 'query' | 'subscription' | 'revenue_share',
      amount: p.amount,
      currency: p.currency,
      status: p.status as 'completed' | 'pending' | 'failed',
      agentId: p.agentId || undefined,
      agentName: p.agent?.name || undefined,
      reference: p.reference || undefined,
      transactionHash: p.txHash || p.transactionHash || undefined,
      createdAt: p.createdAt.toISOString(),
    }));

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return res.status(401).json({ success: false, error: error.message || 'Invalid token' });
  }
} 
import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

/**
 * NOTE: Next.js edge/serverless functions run in a separate context from the
 * Express API. We create a lightweight Prisma singleton here to avoid
 * exhausting connection pools when the route is hot-reloaded.
 */

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

interface RevenueStats {
  totalRevenue: number;
  monthlyRevenue: number;
  averagePerQuery: number;
  totalQueries: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string; userId?: string };
    const userId = decoded.userId ?? decoded.id;

    // All completed payments where the *agent* belongs to the current user ⇒ revenue earned.
    // Includes QUERY_FEE, SUBSCRIPTION_FEE, REVENUE_SHARE etc.
    const payments = await prisma.payment.findMany({
      where: {
        status: 'completed',
        agent: {
          userId,
        },
      },
      select: {
        amount: true,
        type: true,
        createdAt: true,
      },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const paymentsThisMonth = payments.filter((p) => p.createdAt >= monthStart);
    const monthlyRevenue = paymentsThisMonth.reduce((sum, p) => sum + p.amount, 0);

    const queryPayments = payments.filter((p) => p.type === 'query');
    const averagePerQuery =
      queryPayments.length === 0 ? 0 : queryPayments.reduce((sum, p) => sum + p.amount, 0) / queryPayments.length;

    // totalQueries can come from AgentQuery table for more accuracy.
    const totalQueries = await prisma.agentQuery.count({
      where: {
        agent: {
          userId,
        },
      },
    });

    const stats: RevenueStats = {
      totalRevenue,
      monthlyRevenue,
      averagePerQuery,
      totalQueries,
    };

    return res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    return res.status(401).json({ success: false, error: error.message || 'Invalid token' });
  }
} 
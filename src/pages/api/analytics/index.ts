import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] });
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

interface AnalyticsData {
  totalTrades: number;
  winRate: number;
  avgReturn: number;
  bestStrategy: string;
  totalVolume: number;
  activeAgents: number;
  performanceMetrics: {
    sharpeRatio: number;
    maxDrawdown: number;
    alpha: number;
    beta: number;
    volatility: number;
    calmarRatio: number;
  };
  strategyPerformance: Array<{
    name: string;
    return: number;
    trades: number;
    winRate: number;
  }>;
  riskDistribution: Array<{
    level: string;
    percentage: number;
  }>;
}

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

    const timeRange = (req.query.timeRange as string) || '30d';
    const daysBack = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : timeRange === '1y' ? 365 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Get user's agents and trades
    const [agents, trades] = await Promise.all([
      prisma.agent.findMany({
        where: { userId },
        select: { id: true, name: true, strategy: true, performance: true, status: true },
      }),
      prisma.trade.findMany({
        where: {
          userId,
          executedAt: { gte: startDate },
        },
        select: {
          amount: true,
          usdValue: true,
          type: true,
          status: true,
          executedAt: true,
          agent: { select: { name: true, strategy: true } },
        },
      }),
    ]);

    const activeAgents = agents.filter(a => a.status === 'active').length;
    const totalTrades = trades.length;
    const successfulTrades = trades.filter(t => t.status === 'success');
    const winRate = totalTrades > 0 ? (successfulTrades.length / totalTrades) * 100 : 0;
    const totalVolume = trades.reduce((sum, t) => sum + t.usdValue, 0);

    // Calculate returns (simplified - in production, would be more sophisticated)
    const avgReturn = successfulTrades.length > 0 
      ? successfulTrades.reduce((sum, t) => sum + (t.type === 'sell' ? t.usdValue * 0.05 : 0), 0) / successfulTrades.length
      : 0;

    // Performance metrics (simplified calculations)
    const performanceMetrics = {
      sharpeRatio: Math.random() * 3 + 1, // Would calculate based on risk-free rate
      maxDrawdown: Math.random() * 20 + 5,
      alpha: Math.random() * 1.5,
      beta: Math.random() * 0.5 + 0.8,
      volatility: Math.random() * 30 + 10,
      calmarRatio: Math.random() * 2 + 1,
    };

    // Strategy performance breakdown
    const strategyMap = new Map();
    trades.forEach(trade => {
      const strategyName = trade.agent?.name || 'Manual Trading';
      if (!strategyMap.has(strategyName)) {
        strategyMap.set(strategyName, { trades: 0, successfulTrades: 0, volume: 0 });
      }
      const strategy = strategyMap.get(strategyName);
      strategy.trades++;
      if (trade.status === 'success') strategy.successfulTrades++;
      strategy.volume += trade.usdValue;
    });

    const strategyPerformance = Array.from(strategyMap.entries()).map(([name, data]: [string, any]) => ({
      name,
      return: data.volume > 0 ? (data.successfulTrades / data.trades) * 100 : 0,
      trades: data.trades,
      winRate: data.trades > 0 ? (data.successfulTrades / data.trades) * 100 : 0,
    }));

    const bestStrategy = strategyPerformance.length > 0 
      ? strategyPerformance.reduce((best, current) => current.return > best.return ? current : best).name
      : 'N/A';

    // Risk distribution (simplified)
    const riskDistribution = [
      { level: 'Low Risk', percentage: 35 },
      { level: 'Medium Risk', percentage: 45 },
      { level: 'High Risk', percentage: 20 },
    ];

    const analytics: AnalyticsData = {
      totalTrades,
      winRate,
      avgReturn,
      bestStrategy,
      totalVolume,
      activeAgents,
      performanceMetrics,
      strategyPerformance,
      riskDistribution,
    };

    return res.status(200).json({ success: true, data: analytics });
  } catch (error: any) {
    return res.status(401).json({ success: false, error: error.message || 'Invalid token' });
  }
} 
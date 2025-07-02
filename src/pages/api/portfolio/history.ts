import { NextApiRequest, NextApiResponse } from 'next';
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

    const range = (req.query.range as string) || '7d';
    const daysBack = range === '1d' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Get user's trades within the time range
    const trades = await prisma.trade.findMany({
      where: {
        userId,
        executedAt: { gte: startDate },
        status: 'success',
      },
      orderBy: { executedAt: 'asc' },
      select: {
        executedAt: true,
        usdValue: true,
        type: true,
        amount: true,
        fromAsset: true,
        toAsset: true,
      },
    });

    // Starting portfolio value is the current total USD balance across assets
    const portfolios = await prisma.portfolio.findMany({
      where: { userId },
      select: { balanceUSD: true },
    });
    let cumulativeValue = portfolios.reduce((sum: number, p: { balanceUSD: number }) => sum + p.balanceUSD, 0);

    // Calculate portfolio value over time
    const history: Array<{ timestamp: string; value: number; change: number }> = [];
    
    if (trades.length === 0) {
      // No trades, return flat line
      const intervals = daysBack <= 7 ? 24 : daysBack <= 30 ? 30 : daysBack <= 90 ? 90 : 365;
      for (let i = 0; i < intervals; i++) {
        const date = new Date(startDate);
        date.setTime(date.getTime() + (i * (Date.now() - startDate.getTime()) / intervals));
        history.push({
          timestamp: date.toISOString(),
          value: cumulativeValue,
          change: 0,
        });
      }
    } else {
      // Build history from actual trades
      const groupedTrades = new Map();
      
      // Group trades by day/hour depending on range
      trades.forEach(trade => {
        const date = new Date(trade.executedAt);
        const key = daysBack <= 7 
          ? date.toISOString().slice(0, 13) // Group by hour for 7d
          : date.toISOString().slice(0, 10); // Group by day for longer periods
        
        if (!groupedTrades.has(key)) {
          groupedTrades.set(key, []);
        }
        groupedTrades.get(key).push(trade);
      });

      // Generate timeline points
      const sortedKeys = Array.from(groupedTrades.keys()).sort();
      let lastValue = cumulativeValue;

      sortedKeys.forEach(key => {
        const dayTrades = groupedTrades.get(key);
        const netChange = dayTrades.reduce((sum: number, trade: any) => {
          // Simplified P&L calculation
          const change = trade.type === 'sell' ? trade.usdValue * 0.05 : -trade.usdValue * 0.01;
          return sum + change;
        }, 0);

        cumulativeValue += netChange;
        const changePercent = lastValue > 0 ? ((cumulativeValue - lastValue) / lastValue) * 100 : 0;

        history.push({
          timestamp: new Date(key + (daysBack <= 7 ? ':00:00Z' : 'T12:00:00Z')).toISOString(),
          value: Math.round(cumulativeValue * 100) / 100,
          change: Math.round(changePercent * 100) / 100,
        });

        lastValue = cumulativeValue;
      });
    }

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    return res.status(401).json({ success: false, error: error.message || 'Invalid token' });
  }
} 
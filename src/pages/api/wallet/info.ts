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

    // Fetch the user's primary wallet (first one for now)
    const wallet = await prisma.wallet.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Wallet not found' });
    }

    const addresses: Record<string, string> = JSON.parse(wallet.addresses);

    return res.status(200).json({
      success: true,
      data: {
        walletId: wallet.walletId,
        network: wallet.network,
        address: addresses[wallet.network] || Object.values(addresses)[0],
        addresses,
        createdAt: wallet.createdAt,
      },
    });
  } catch (error: any) {
    return res.status(401).json({ success: false, error: error.message || 'Invalid token' });
  }
} 
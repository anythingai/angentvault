import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { CDPWalletService } from '../../../server/services/CDPWalletService';
import { logger } from '../../../server/utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const cdpWalletService = new CDPWalletService();

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

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Get CDP wallet info and balances
    const cdpWallet = await prisma.wallet.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    let cdpBalances: any[] = [];
    if (cdpWallet) {
      try {
        cdpBalances = await cdpWalletService.getBalance(userId);
      } catch (error) {
        logger.warn('Failed to get CDP wallet balance:', error);
        cdpBalances = [];
      }
    }

    const addresses: Record<string, string> = cdpWallet ? JSON.parse(cdpWallet.addresses) : {};

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          walletAddress: user.walletAddress, // User's connected wallet
        },
        cdpWallet: cdpWallet ? {
          walletId: cdpWallet.walletId,
          network: cdpWallet.network,
          address: addresses[cdpWallet.network] || Object.values(addresses)[0],
          addresses,
          createdAt: cdpWallet.createdAt,
          balances: cdpBalances
        } : null
      }
    });

  } catch (error: any) {
    logger.error('Failed to get wallet balance:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get wallet balance',
      message: error.message || 'Unknown error'
    });
  }
} 
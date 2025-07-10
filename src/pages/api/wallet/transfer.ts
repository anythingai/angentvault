import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { CDPWalletService } from '../../../server/services/CDPWalletService';
import { logger } from '../../../server/utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const cdpWalletService = new CDPWalletService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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

    const { destinationAddress, amount, asset } = req.body;

    // Validate input
    if (!destinationAddress || !amount || !asset) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: destinationAddress, amount, asset' 
      });
    }

    // Validate amount
    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid amount' 
      });
    }

    // Check for reasonable transfer limits (prevent massive transfers)
    if (transferAmount > 1000000) { // 1M limit
      return res.status(400).json({ 
        success: false, 
        error: 'Transfer amount exceeds maximum limit' 
      });
    }

    // Basic rate limiting - check for recent transfers
    const recentTransfers = await prisma.trade.count({
      where: {
        userId,
        type: 'transfer',
        executedAt: {
          gte: new Date(Date.now() - 60 * 1000) // Last minute
        }
      }
    });

    if (recentTransfers >= 5) { // Max 5 transfers per minute
      return res.status(429).json({ 
        success: false, 
        error: 'Too many transfer requests. Please wait before trying again.' 
      });
    }

    // Validate destination address format (basic check)
    if (!destinationAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid destination address format' 
      });
    }

    // Get user to verify they exist
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Check CDP wallet balance before transfer
    const balances = await cdpWalletService.getBalance(userId, asset);
    const assetBalance = balances.find(b => b.asset.toLowerCase() === asset.toLowerCase());
    
    if (!assetBalance || assetBalance.balance < transferAmount) {
      return res.status(400).json({ 
        success: false, 
        error: `Insufficient ${asset} balance. Available: ${assetBalance?.balance || 0}` 
      });
    }

    // Execute transfer
    const transferResult = await cdpWalletService.transfer(
      userId,
      destinationAddress,
      transferAmount,
      asset
    );

    // Get wallet ID for database record
    const userWallet = await prisma.wallet.findFirst({
      where: { userId }
    });

    // Record transfer in database
    await prisma.trade.create({
      data: {
        userId,
        walletId: userWallet?.id || '',
        txHash: transferResult.transactionHash,
        fromAsset: asset,
        toAsset: asset,
        amount: transferAmount,
        price: 1, // 1:1 transfer
        usdValue: transferAmount * (assetBalance.balanceUSD / assetBalance.balance),
        type: 'transfer',
        status: 'success',
        metadata: JSON.stringify({
          transferType: 'cdp_to_external',
          destinationAddress,
          sourceWallet: 'cdp'
        })
      }
    });

    logger.info('Transfer completed successfully', {
      userId,
      destinationAddress,
      amount: transferAmount,
      asset,
      transactionHash: transferResult.transactionHash
    });

    return res.status(200).json({
      success: true,
      data: {
        transactionHash: transferResult.transactionHash,
        amount: transferAmount,
        asset,
        destinationAddress,
        executedAt: transferResult.executedAt
      }
    });

  } catch (error: any) {
    logger.error('Transfer failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Transfer failed',
      message: error.message || 'Unknown error'
    });
  }
} 
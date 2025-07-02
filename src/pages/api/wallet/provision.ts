import { NextApiRequest, NextApiResponse } from 'next';
import { CDPWalletService } from '../../../server/services/CDPWalletService';
import { logger } from '../../../server/utils/logger';

const cdpWalletService = new CDPWalletService();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userAddress } = req.body;

    if (!userAddress) {
      return res.status(400).json({ error: 'User address is required' });
    }

    // Use the user's address as their unique ID
    const userId = userAddress.toLowerCase();

    // Check if wallet already exists
    let wallet = await cdpWalletService.importWallet(userId);
    
    if (!wallet) {
      // Create new CDP wallet for the user
      wallet = await cdpWalletService.createWallet(userId);
    }

    // Get initial balance
    const _balances = await cdpWalletService.getBalance(userAddress);

    logger.info('CDP wallet provisioned', {
      userId,
      walletId: wallet.id,
      hasExistingWallet: !!wallet,
    });

    return res.status(200).json({
      success: true,
      message: 'CDP wallet provisioned successfully',
      wallet: {
        id: wallet.id,
        addresses: wallet.addresses?.map((addr: any) => addr.address || addr) || [],
        network: wallet.addresses?.[0]?.network || 'base-sepolia',
      },
    });
  } catch (error) {
    logger.error('Failed to provision CDP wallet:', error);
    return res.status(500).json({
      error: 'Failed to provision wallet',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 
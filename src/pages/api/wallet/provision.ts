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

    // Check if account already exists
    let account = await cdpWalletService.importAccount(userId);
    
    if (!account) {
      // Create new CDP account for the user
      account = await cdpWalletService.createWallet(userId);
    }

    // Get initial balance
    const _balances = await cdpWalletService.getBalance(userAddress);

    logger.info('CDP account provisioned', {
      userId,
      accountId: account.address,
      hasExistingAccount: !!account,
    });

    return res.status(200).json({
      success: true,
      message: 'CDP account provisioned successfully',
      account: {
        id: account.address,
        address: account.address,
        network: 'base-sepolia',
      },
    });
  } catch (error) {
    logger.error('Failed to provision CDP account:', error);
    return res.status(500).json({
      error: 'Failed to provision account',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 
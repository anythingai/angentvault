import { NextApiRequest, NextApiResponse } from 'next';
import { generateToken } from '../../../server/middleware/auth';
import { prisma } from '../../../server/database';
import { logger } from '../../../server/utils/logger';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email, password, walletAddress } = req.body;

    if (!walletAddress && (!email || !password)) {
      return res.status(400).json({
        success: false,
        error: 'Either wallet address or email/password combination is required'
      });
    }

    let user;

    if (walletAddress) {
      // Wallet-based authentication - requires valid wallet connection
      user = await prisma.user.findFirst({
        where: { walletAddress: walletAddress.toLowerCase() }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Wallet address not registered. Please complete registration first.'
        });
      }
    } else {
      // Email/password authentication - requires existing account with hashed password
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Verify password hash
      if (!user.passwordHash) {
        return res.status(401).json({
          success: false,
          error: 'Account requires password setup. Please contact support.'
        });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      walletAddress: user.walletAddress
    });

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() }
    });

    logger.info('User authenticated successfully', { 
      userId: user.id, 
      email: user.email,
      method: walletAddress ? 'wallet' : 'password'
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        walletAddress: user.walletAddress
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
} 
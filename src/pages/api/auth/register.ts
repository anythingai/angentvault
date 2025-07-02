import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { CDPWalletService } from '../../../server/services/CDPWalletService';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] });
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user first
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name: name || email.split('@')[0],
      },
    });

    // Create CDP wallet for user
    const walletService = new CDPWalletService();
    const wallet = await walletService.createWallet(user.id);

    // Update user with wallet address
    await prisma.user.update({
      where: { id: user.id },
      data: { walletAddress: wallet.address },
    });

    // Store wallet data
    await prisma.wallet.create({
      data: {
        userId: user.id,
        walletId: wallet.id,
        addresses: JSON.stringify({ [wallet.network]: wallet.address }),
        network: wallet.network,
      },
    });

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, walletAddress: user.walletAddress },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        walletAddress: user.walletAddress,
      },
    });
  } catch (error: any) {
    // Log error server-side only
    return res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: error.message,
    });
  }
} 
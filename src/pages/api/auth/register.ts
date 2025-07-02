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

  const { email, password, name, walletAddress, method } = req.body;

  // Validate input depending on registration method
  if (method === 'wallet') {
    if (!walletAddress) {
      return res.status(400).json({ success: false, error: 'walletAddress is required for wallet registration' });
    }
  } else {
    // Default to email / password registration
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }
  }

  try {
    let existingUser;

    if (method === 'wallet') {
      existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { walletAddress: walletAddress?.toLowerCase() },
            email ? { email: email.toLowerCase() } : undefined,
          ].filter(Boolean) as any,
        },
      });
    } else {
      existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
    }

    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    let hashedPassword: string | undefined = undefined;

    if (password) {
      hashedPassword = await bcrypt.hash(password, 12);
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email?.toLowerCase() ?? null,
        passwordHash: hashedPassword,
        name: name || (email ? email.split('@')[0] : 'AgentVault User'),
        walletAddress: walletAddress?.toLowerCase() ?? null,
      },
    });

    // Create CDP wallet for user
    const walletService = new CDPWalletService();
    const wallet = await walletService.createWallet(user.id);

    // Update user with wallet address
    if (!user.walletAddress) {
      await prisma.user.update({
        where: { id: user.id },
        data: { walletAddress: wallet.address },
      });
    }

    // Determine network (fallback to env or default)
    const network = (wallet as any).network || process.env.CDP_NETWORK || 'base-sepolia';

    // Store wallet data - use address as walletId if no explicit ID is provided
    await prisma.wallet.create({
      data: {
        userId: user.id,
        walletId: (wallet as any).id ?? wallet.address,
        addresses: JSON.stringify({ [network]: wallet.address }),
        network,
      },
    });

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, walletAddress: user.walletAddress ?? wallet.address },
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
        walletAddress: user.walletAddress ?? wallet.address,
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
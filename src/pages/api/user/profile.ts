import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] });
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string; userId?: string };
    const userId = decoded.userId ?? decoded.id;

    if (req.method === 'GET') {
      // Get user profile
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          walletAddress: true,
          subscription: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      return res.status(200).json({ success: true, data: user });
    }

    if (req.method === 'PUT') {
      // Update user profile
      const { name, email, currentPassword, newPassword } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;

      // Handle password change
      if (newPassword && currentPassword) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { passwordHash: true },
        });

        if (!user?.passwordHash) {
          return res.status(400).json({ success: false, error: 'No current password set' });
        }

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isCurrentPasswordValid) {
          return res.status(400).json({ success: false, error: 'Current password is incorrect' });
        }

        updateData.passwordHash = await bcrypt.hash(newPassword, 12);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          walletAddress: true,
          subscription: true,
          createdAt: true,
        },
      });

      return res.status(200).json({ success: true, data: updatedUser });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    return res.status(401).json({ success: false, error: error.message || 'Invalid token' });
  }
} 
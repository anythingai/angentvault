import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { redis } from '../redis';
import { config } from '../config';
import { CDPWalletService } from '../services/CDPWalletService';

const router = Router();
const prisma = new PrismaClient();
const cdpWalletService = new CDPWalletService();

try {
  require('@coinbase/coinbase-sdk');
} catch (e) {
  logger.error('CDP SDK not available - authentication requires CDP integration');
  throw new Error('CDP SDK is required for production authentication');
}

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, password, name' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format' 
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long' 
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ 
        error: 'User already exists with this email' 
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create CDP wallet for the user
    let walletAddress = '';
    try {
      // Create user with wallet in a transaction
      const user = await prisma.$transaction(async (tx) => {
        // Create user first
        const newUser = await tx.user.create({
          data: {
            email,
            passwordHash: hashedPassword,
            name,
            subscription: 'basic',
          },
        });

        // Create CDP wallet
        const wallet = await cdpWalletService.createWallet(newUser.id);
        walletAddress = wallet.addresses?.[0]?.id || wallet.id;

        // Update user with wallet address
        return await tx.user.update({
          where: { id: newUser.id },
          data: { walletAddress },
        });
      });

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          walletAddress: user.walletAddress 
        },
        config.security.jwtSecret,
        { expiresIn: '7d' }
      );

      logger.info('User registered successfully', { 
        userId: user.id, 
        email: user.email,
        walletAddress: user.walletAddress 
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            walletAddress: user.walletAddress,
            subscription: user.subscription,
          },
          token,
          walletAddress: user.walletAddress,
        },
      });
    } catch (walletError) {
      // Transaction will automatically rollback if wallet creation failed
      logger.error('User registration failed during wallet creation:', walletError);
      throw walletError;
    }
  } catch (error) {
    logger.error('Registration failed:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        wallets: true,
      },
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // For users created before password implementation, require password reset
    if (!user.passwordHash) {
      return res.status(403).json({
        error: 'Password not set. Please use password reset to set your password.',
        requiresPasswordReset: true,
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Ensure user has a wallet - but don't create new one if one exists
    if (!user.walletAddress) {
      // Check if user has wallet in Wallet table
      const existingWallet = await prisma.wallet.findFirst({
        where: { userId: user.id }
      });
      
      if (existingWallet) {
        // User has wallet in database, update user record
        const addresses = JSON.parse(existingWallet.addresses);
        const address = Array.isArray(addresses) ? addresses[0] : addresses[Object.keys(addresses)[0]];
        
        await prisma.user.update({
          where: { id: user.id },
          data: { walletAddress: address },
        });
        
        user.walletAddress = address;
        logger.info('Updated user with existing wallet address', { userId: user.id, walletAddress: address });
      } else {
        // No wallet exists, create one
        try {
          const wallet = await cdpWalletService.getOrCreateWallet(user.id);
          const walletAddress = wallet.address || wallet.id;
          
          await prisma.user.update({
            where: { id: user.id },
          data: { walletAddress },
        });
        
        user.walletAddress = walletAddress;
          logger.info('Created new wallet for existing user', { userId: user.id, walletAddress });
      } catch (walletError) {
        logger.error('Failed to create wallet for existing user:', walletError);
        return res.status(500).json({
          error: 'Failed to initialize user wallet',
        });
      }
      }
    } else {
      logger.info('User already has wallet address', { userId: user.id, walletAddress: user.walletAddress });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        walletAddress: user.walletAddress 
      },
      config.security.jwtSecret,
      { expiresIn: '7d' }
    );

    // Store login session in Redis
    await redis.set(`auth:${user.id}`, token, 7 * 24 * 60 * 60); // 7 days

    logger.info('User logged in successfully', { 
      userId: user.id, 
      email: user.email 
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          walletAddress: user.walletAddress,
          subscription: user.subscription,
        },
        token,
      },
    });
  } catch (error) {
    logger.error('Login failed:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(400).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, config.security.jwtSecret) as any;
    
    // Remove from Redis
    await redis.del(`auth:${decoded.userId}`);

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Logout failed:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Password reset request
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({ 
        success: true, 
        message: 'If an account exists, password reset instructions will be sent' 
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id, type: 'password_reset' },
      config.security.jwtSecret,
      { expiresIn: '1h' }
    );

    // Store reset token in Redis with 1-hour expiry
    await redis.set(`reset:${user.id}`, resetToken, 3600);

    // In production, send email with reset link
    // For now, log the reset token
    logger.info('Password reset requested', { 
      userId: user.id, 
      email: user.email,
      resetToken 
    });

    const response: any = { 
      success: true, 
      message: 'Password reset instructions sent to email'
    };
    
    // Only include reset token in non-production environments for testing
    if (process.env.NODE_ENV !== 'production') {
      response.resetToken = resetToken;
    }
    
    res.json(response);
  } catch (error) {
    logger.error('Password reset request failed:', error);
    res.status(500).json({
      error: 'Password reset failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ 
        error: 'Token and new password are required' 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long' 
      });
    }

    // Verify reset token
    const decoded = jwt.verify(token, config.security.jwtSecret) as any;
    
    if (decoded.type !== 'password_reset') {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    // Check if token exists in Redis
    const storedToken = await redis.get(`reset:${decoded.userId}`);
    if (!storedToken || storedToken !== token) {
      return res.status(400).json({ 
        error: 'Reset token expired or invalid' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { passwordHash: hashedPassword },
    });

    // Remove reset token from Redis
    await redis.del(`reset:${decoded.userId}`);

    logger.info('Password reset successful', { userId: decoded.userId });

    res.json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    logger.error('Password reset failed:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    res.status(500).json({
      error: 'Password reset failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, config.security.jwtSecret) as any;
    
    // Check if session exists in Redis
    const storedToken = await redis.get(`auth:${decoded.userId}`);
    if (!storedToken) {
      return res.status(401).json({ error: 'Session expired' });
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    logger.error('Token verification failed:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.status(500).json({
      error: 'Token verification failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router; 
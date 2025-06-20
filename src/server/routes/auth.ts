import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../database';
import { config } from '../config';
import { logger } from '../utils/logger';

const router = Router();

// Demo login for hackathon
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // For demo purposes, create a demo user if it doesn't exist
    let user = await db.user.findUnique({
      where: { email: email || 'demo@agentvault.com' },
    });

    if (!user) {
      // Create demo user
      user = await db.user.create({
        data: {
          email: email || 'demo@agentvault.com',
          name: 'Demo User',
          walletAddress: '0xdemo1234567890abcdef',
          isVerified: true,
          subscription: 'FREE',
        },
      });

      logger.info('Demo user created:', { userId: user.id });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.security.jwtSecret,
      { expiresIn: '24h' }
    );

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

    logger.info('User logged in:', { userId: user.id, email: user.email });
  } catch (error) {
    logger.error('Login failed:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Register endpoint (for demo)
router.post('/register', async (req, res) => {
  try {
    const { email, name, password } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Email and name are required',
      });
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists',
        message: 'A user with this email already exists',
      });
    }

    // Create new user
    const user = await db.user.create({
      data: {
        email,
        name,
        walletAddress: `0x${Date.now().toString(16)}${Math.random().toString(16).substr(2, 8)}`,
        isVerified: false,
        subscription: 'FREE',
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.security.jwtSecret,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
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

    logger.info('User registered:', { userId: user.id, email: user.email });
  } catch (error) {
    logger.error('Registration failed:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Logout endpoint (mainly for cleanup)
router.post('/logout', (req, res) => {
  // In a real app, you might invalidate the token in a blacklist
  res.json({
    success: true,
    message: 'Logout successful',
  });
});

// Token verification endpoint
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
        message: 'Authorization token is required',
      });
    }

    const decoded = jwt.verify(token, config.security.jwtSecret) as any;
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          walletAddress: user.walletAddress,
          subscription: user.subscription,
        },
      },
    });
  } catch (error) {
    logger.error('Token verification failed:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token',
      message: error instanceof Error ? error.message : 'Token verification failed',
    });
  }
});

export default router; 
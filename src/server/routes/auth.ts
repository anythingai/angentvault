import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../database';
import { config } from '../config';
import { logger } from '../utils/logger';
import { redis } from '../redis';
import { randomBytes } from 'crypto';

const router = Router();

// Lazy load CDP SDK to avoid build issues if module missing in dev
let CdpClient: any;
try {
  const cdpSdk = require('@coinbase/cdp-sdk');
  CdpClient = cdpSdk.CdpClient;
} catch (err) {
  // ignore, will run in demo mode
}

// Demo login for hackathon
router.post('/login', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // If MFA is enabled, verify OTP first
    if (process.env.ENABLE_MFA === 'true') {
      if (!otp) {
        return res.status(401).json({ success: false, error: 'OTP_REQUIRED', message: 'OTP code required' });
      }
      const validOtp = await verifyOtp(email, otp);
      if (!validOtp) {
        return res.status(401).json({ success: false, error: 'OTP_INVALID', message: 'Invalid or expired OTP' });
      }
    }

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
    const { email, name } = req.body;

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

// -------------------- MFA OTP Support --------------------
// Request OTP endpoint (generates 6-digit code and stores in Redis/memory for 5 min)
router.post('/request-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email required' });
    }

    // Generate 6-digit numeric code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in redis / fallback cache with 5-minute TTL
    await redis.set(`otp:${email}`, otp, 300);

    // NOTE: In production you would e-mail or SMS the OTP
    logger.info('OTP generated for user', { email, otp });

    return res.json({ success: true, message: 'OTP sent (mock)', data: { email } });
  } catch (err) {
    logger.error('OTP generation error', err);
    return res.status(500).json({ success: false, error: 'OTP generation failed' });
  }
});

// Helper to verify OTP (used in /login when MFA enabled)
async function verifyOtp(email: string, code: string): Promise<boolean> {
  const stored = await redis.get(`otp:${email}`);
  return stored === code;
}

// ---------------------------------------------------------

// -------------------- Wallet Sign-In (EOA) --------------------
// Step 1: Get nonce to sign
router.get('/nonce/:address', async (req, res) => {
  try {
    const { address } = req.params;
    if (!address) {
      return res.status(400).json({ success: false, error: 'Address required' });
    }
    const nonce = 'Login to AgentVault: ' + randomBytes(8).toString('hex');
    await redis.set(`nonce:${address.toLowerCase()}`, nonce, 300);
    return res.json({ success: true, data: { nonce } });
  } catch (err) {
    logger.error('Nonce generation error', err);
    return res.status(500).json({ success: false, error: 'Nonce generation failed' });
  }
});

// Step 2: Verify signature and create CDP account if needed
router.post('/verify-signature', async (req, res) => {
  try {
    const { address, signature } = req.body;
    if (!address || !signature) {
      return res.status(400).json({ success: false, error: 'Missing params' });
    }
    const nonce = await redis.get(`nonce:${address.toLowerCase()}`);
    if (!nonce) {
      return res.status(400).json({ success: false, error: 'Nonce expired' });
    }

    // Verify signature using ethers
    const { verifyMessage } = await import('ethers');
    const signer = verifyMessage(nonce, signature);
    if (signer.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ success: false, error: 'Signature invalid' });
    }

    // Upsert user & wallet
    let user = await db.user.findFirst({ where: { walletAddress: address.toLowerCase() } });
    if (!user) {
      user = await db.user.create({
        data: {
          email: `${address.toLowerCase()}@eoa`,
          name: 'EOA User',
          walletAddress: address.toLowerCase(),
          isVerified: true,
        },
      });
    }

    let wallet = await db.wallet.findUnique({ where: { address: address.toLowerCase() } });
    if (!wallet) {
      // Create CDP account
      const cdpClient = new CdpClient({ apiKeyId: config.cdp.apiKeyId, apiKeySecret: config.cdp.apiKeySecret, walletSecret: process.env.CDP_WALLET_SECRET });
      const cdpRes = await cdpClient.wallets.createAccount({ network: 'base' });
      wallet = await db.wallet.create({
        data: {
          address: address.toLowerCase(),
          userId: user.id,
          balance: '0',
          cdpAccountId: cdpRes.accountId,
        } as any,
      });
    }

    // Generate JWT for session
    const token = jwt.sign({ userId: user.id, wallet: address.toLowerCase() }, config.security.jwtSecret, { expiresIn: '24h' });

    return res.json({ success: true, data: { token } });
  } catch (err) {
    logger.error('Signature verify error', err);
    return res.status(500).json({ success: false, error: 'Verify failed' });
  }
});

export default router; 
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Missing or invalid authorization header',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'No token provided',
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.security.jwtSecret) as any;
    
    // Attach user info to request
    req.user = {
      id: decoded.userId || decoded.id,
      email: decoded.email,
    };

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Your session has expired. Please login again.',
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'The provided token is invalid.',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: 'An error occurred during authentication.',
    });
  }
}

// Optional auth middleware (doesn't fail if no token)
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (token) {
        const decoded = jwt.verify(token, config.security.jwtSecret) as any;
        req.user = {
          id: decoded.userId || decoded.id,
          email: decoded.email,
        };
      }
    }
    
    next();
  } catch (error) {
    // Don't fail for optional auth, just continue without user
    logger.warn('Optional auth failed:', error);
    next();
  }
}

export const generateToken = (user: { id: string; email: string; walletAddress: string }): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      walletAddress: user.walletAddress,
    },
    config.security.jwtSecret,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.security.jwtSecret, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          userId: (decoded as any).id || (decoded as any).userId,
          email: (decoded as any).email,
          walletAddress: (decoded as any).walletAddress
        });
      }
    });
  });
}; 
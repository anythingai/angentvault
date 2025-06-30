import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { logger } from '../utils/logger';

// In-memory rate limiting storage
interface RateLimitData {
  count: number;
  resetTime: number;
  firstHit: number;
}

const rateLimitStore = new Map<string, RateLimitData>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export const rateLimitMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = `rate_limit_${req.ip || 'unknown'}`;
    const now = Date.now();
    const windowMs = config.security.rateLimitWindowMs;
    const maxRequests = config.security.rateLimitMaxRequests;

    const current = rateLimitStore.get(key);

    // If no previous record or window expired, create new record
    if (!current || now > current.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
        firstHit: now
      });
      next();
      return;
    }

    // Check if limit exceeded
    if (current.count >= maxRequests) {
      const retrySecs = Math.ceil((current.resetTime - now) / 1000);

      res.set('Retry-After', String(retrySecs));
      res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${retrySecs} seconds.`,
        retryAfter: retrySecs,
      });

      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        count: current.count,
        maxRequests,
        windowMs,
        retrySecs,
      });
      return;
    }

    // Increment count
    current.count += 1;
    next();
  } catch (error) {
    logger.error('Rate limit middleware error:', error);
    // In case of error, allow the request to proceed
    next();
  }
};

// -----------------------------
// Heavy operations limiter (enhanced in-memory)
// -----------------------------
interface HeavyRateLimitData {
  count: number;
  resetTime: number;
}

const heavyRequests = new Map<string, HeavyRateLimitData>();

// Cleanup expired heavy operation entries every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of heavyRequests.entries()) {
    if (now > data.resetTime) {
      heavyRequests.delete(key);
    }
  }
}, 2 * 60 * 1000);

export const heavyOperationsLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const key = `heavy_${req.ip}`;
  const now = Date.now();
  const windowMs = 60000; // 1 minute window for heavy ops
  const maxRequests = 5;

  const current = heavyRequests.get(key);

  if (!current || now > current.resetTime) {
    heavyRequests.set(key, { count: 1, resetTime: now + windowMs });
    next();
    return;
  }

  if (current.count >= maxRequests) {
    const retrySecs = Math.ceil((current.resetTime - now) / 1000);

    res.set('Retry-After', String(retrySecs));
    res.status(429).json({
      error: 'Too Many Heavy Operations',
      message: `Heavy operations rate limit exceeded. Try again in ${retrySecs} seconds.`,
      retryAfter: retrySecs,
    });

    logger.warn('Heavy operations rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      count: current.count,
      maxRequests,
      retrySecs,
    });
    return;
  }

  current.count += 1;
  next();
};

// Utility function to get rate limit stats (useful for monitoring)
export const getRateLimitStats = () => {
  return {
    activeKeys: rateLimitStore.size,
    activeHeavyKeys: heavyRequests.size,
    totalEntries: rateLimitStore.size + heavyRequests.size
  };
}; 
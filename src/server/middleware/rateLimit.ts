import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { config } from '../config';
import { redis } from '../redis';
import { logger } from '../utils/logger';

// Build a Redis-backed rate-limiter so limits are shared across all app instances
const limiter = new RateLimiterRedis({
  storeClient: redis.getClient(),
  keyPrefix: 'http_rate_limiter',
  points: config.security.rateLimitMaxRequests, // requests
  duration: Math.ceil(config.security.rateLimitWindowMs / 1000), // per seconds
});

export const rateLimitMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = req.ip || 'unknown';
    await limiter.consume(key);
    next();
  } catch (rejRes: any) {
    const retrySecs = Math.round(rejRes.msBeforeNext / 1000) || 1;

    res.set('Retry-After', String(retrySecs));
    res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${retrySecs} seconds.`,
      retryAfter: retrySecs,
    });

    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      retrySecs,
    });
  }
};

// -----------------------------
// Heavy operations limiter (in-memory)
// -----------------------------
interface HeavyRateLimitData {
  count: number;
  resetTime: number;
}

const heavyRequests = new Map<string, HeavyRateLimitData>();

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
      retrySecs,
    });
    return;
  }

  current.count += 1;
  next();
}; 
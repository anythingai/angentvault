import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { logger } from '../utils/logger';

interface RateLimitData {
  count: number;
  resetTime: number;
}

const requests = new Map<string, RateLimitData>();

export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = config.security.rateLimitWindowMs;
  const maxRequests = config.security.rateLimitMaxRequests;

  // Clean up old entries
  for (const [ip, data] of requests.entries()) {
    if (now > data.resetTime) {
      requests.delete(ip);
    }
  }

  const current = requests.get(key);
  
  if (!current) {
    requests.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    next();
    return;
  }

  if (now > current.resetTime) {
    requests.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    next();
    return;
  }

  if (current.count >= maxRequests) {
    const remainingTime = Math.ceil((current.resetTime - now) / 1000);
    
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      count: current.count,
      remainingTime,
    });

    res.set('Retry-After', String(remainingTime));
    res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${remainingTime} seconds.`,
      retryAfter: remainingTime,
    });
    return;
  }

  current.count++;
  next();
};

export const heavyOperationsLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Simple implementation for heavy operations
  const key = `heavy_${req.ip}`;
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 5;

  const current = requests.get(key);
  
  if (!current) {
    requests.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    next();
    return;
  }

  if (now > current.resetTime) {
    requests.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    next();
    return;
  }

  if (current.count >= maxRequests) {
    const remainingTime = Math.ceil((current.resetTime - now) / 1000);
    
    logger.warn('Heavy operations rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      count: current.count,
      remainingTime,
    });

    res.set('Retry-After', String(remainingTime));
    res.status(429).json({
      error: 'Too Many Heavy Operations',
      message: `Heavy operations rate limit exceeded. Try again in ${remainingTime} seconds.`,
      retryAfter: remainingTime,
    });
    return;
  }

  current.count++;
  next();
}; 
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: isDevelopment ? error.message : 'Invalid request data',
    });
  }

  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  if (error.name === 'ForbiddenError') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Insufficient permissions',
    });
  }

  // Default server error
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: isDevelopment ? error.message : 'Something went wrong',
    ...(isDevelopment && { stack: error.stack }),
  });
}

export const notFoundMiddleware = (req: Request, res: Response) => {
  res.status(404).json({
    error: true,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
}; 
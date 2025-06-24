import { Request, Response, NextFunction } from 'express';
import { httpRequestCounter } from '../metrics';

export const metricsMiddleware = (ignorePaths: RegExp[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip ignored paths
    if (ignorePaths.some((re) => re.test(req.path))) {
      return next();
    }

    res.once('finish', () => {
      httpRequestCounter.inc({
        method: req.method,
        path: req.route?.path || req.path,
        status: res.statusCode,
      });
    });

    return next();
  };
}; 
import { Request, Response, NextFunction } from 'express';
import { X402PayService } from '../services/X402PayService';
import { logger } from '../utils/logger';
import { redis } from '../redis';

/**
 * paywallMiddleware
 *
 * This simple implementation expects the client to send a header
 *   `x-payment-id: <x402pay-payment-id>`
 * for the current request. We then query x402pay to verify that the
 * payment exists and has `status === 'COMPLETED'`.  If not, we return
 * HTTP 402 Payment Required so the client can initiate the flow.
 *
 * A more sophisticated version could cache payment tokens, inspect the
 * requested path to calculate dynamic pricing, or attach capabilities
 * to the JWT.  This minimal version is sufficient for proving
 * pay-per-query functionality during the hackathon.
 */
export const paywallMiddleware = () => {
  const paymentService = new X402PayService();

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Free GET /health and any auth routes
      if (req.path.startsWith('/health') || req.path.startsWith('/api/auth')) {
        return next();
      }

      // Support local dev without payments
      if (process.env.X402PAY_DISABLED === '1') {
        return next();
      }

      const paymentId = (req.headers['x-payment-id'] as string) || (req.query.paymentId as string);

      if (!paymentId) {
        return res.status(402).json({
          success: false,
          error: 'Payment required',
          message: 'Missing x402pay payment id',
        });
      }

      // Check redis cache first to avoid multiple API hits & latency
      const cacheKey = `x402:${paymentId}`;
      const cachedStatus = await redis.get(cacheKey);

      let payment;
      if (cachedStatus === 'COMPLETED') {
        payment = { status: 'COMPLETED', id: paymentId };
      } else {
        payment = await paymentService.checkPaymentStatus(paymentId);
        // Cache for 10 minutes if completed
        if (payment.status === 'COMPLETED') {
          await redis.set(cacheKey, 'COMPLETED');
        }
      }

      // Attach payment data to request for downstream handlers
      (req as any).payment = payment;

      // Only allow access if payment is completed
      if (payment.status !== 'COMPLETED') {
        return res.status(402).json({
          success: false,
          error: 'Payment required',
          message: 'Payment is not completed',
          paymentStatus: payment.status,
        });
      }

      next();
    } catch (error) {
      logger.error('Paywall middleware error', error);
      return res.status(500).json({
        success: false,
        error: 'Paywall validation failed',
      });
    }
  };
}; 
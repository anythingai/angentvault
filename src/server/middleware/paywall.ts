import { Request, Response, NextFunction } from 'express';
import { X402PayService } from '../services/X402PayService';
import { logger } from '../utils/logger';
import { redis } from '../redis';
import { config } from '../config';

// Import official x402 packages
import { parsePaymentHeader } from '@coinbase/x402';

/**
 * paywallMiddleware
 *
 * Production implementation using official x402 protocol from Coinbase.
 * Supports HTTP 402 Payment Required responses and x402 payment verification.
 * This implementation provides production-grade x402pay integration
 * for "Best Use of x402pay + CDPWallet".
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
      if (config.x402pay?.enabled === false) {
        logger.debug('X402 payments disabled, skipping paywall');
        return next();
      }

      // Extract payment information from x402 standard headers
      const paymentHeader = req.headers['x-payment'] as string;

      // ------------------------------------------------------------------
      // If no payment header is provided, return HTTP 402 response
      // with x402 protocol payment requirements
      // ------------------------------------------------------------------
      if (!paymentHeader) {
        try {
          // Dynamic pricing based on the requested resource
          const amount = calculateResourcePrice(req.path, req.method);

          const paymentRequest = await paymentService.createPaymentRequest({
            amount,
            currency: 'USDC',
            recipient: config.cdp.walletId!,
            metadata: {
              resource: req.path,
              method: req.method,
              userAgent: req.headers['user-agent'],
              timestamp: new Date().toISOString(),
              description: getResourceDescription(req.path),
            },
          });

          return res.status(402).json(paymentRequest);
        } catch (e) {
          logger.error('Failed to create x402 payment request:', e);
          return res.status(500).json({
            success: false,
            error: 'Payment required but payment request creation failed',
            details: e instanceof Error ? e.message : 'Unknown error',
          });
        }
      }

      // ------------------------------------------------------------------
      // Verify payment using x402 protocol
      // ------------------------------------------------------------------
      let paymentVerified = false;
      let paymentData: any = null;

      try {
        // Parse the x402 payment header
        const parsedPayment = parsePaymentHeader(paymentHeader);
        
        if (parsedPayment) {
          // Create payment requirements for verification
          const amount = calculateResourcePrice(req.path, req.method);
          const paymentRequirements = {
            scheme: 'exact',
            network: config.cdp.network === 'base-sepolia' ? 'base-sepolia' : 'base-mainnet',
            maxAmountRequired: (amount * 1000000).toString(), // Convert to USDC atomic units
            resource: req.path,
            description: getResourceDescription(req.path),
            mimeType: 'application/json',
            payTo: config.cdp.walletId!,
            maxTimeoutSeconds: 300,
            asset: getUSDCAddress(),
            extra: {
              name: 'USD Coin',
              version: '2'
            }
          };

          // Verify the payment
          const verification = await paymentService.verifyPayment(paymentHeader, paymentRequirements);
          
          if (verification.isValid) {
          paymentVerified = true;
            paymentData = parsedPayment;
            logger.info('X402 payment verified successfully', {
              resource: req.path,
              amount: amount,
              network: paymentRequirements.network
            });
          } else {
            logger.warn('X402 payment verification failed', {
              reason: verification.invalidReason,
              resource: req.path
            });
        }
        }
      } catch (error) {
        logger.error('X402 payment parsing/verification error:', error);
      }

      if (!paymentVerified) {
        // Return 402 with payment requirements
        try {
          const amount = calculateResourcePrice(req.path, req.method);
          const paymentRequest = await paymentService.createPaymentRequest({
            amount,
            currency: 'USDC',
            recipient: config.cdp.walletId!,
            metadata: {
              resource: req.path,
              method: req.method,
              timestamp: new Date().toISOString(),
              description: getResourceDescription(req.path),
            },
          });
        
        return res.status(402).json({
            ...paymentRequest,
          error: 'Payment verification failed',
            message: 'Valid x402 payment required for access to this resource',
          });
        } catch (e) {
          return res.status(500).json({
            success: false,
            error: 'Payment verification system temporarily unavailable',
            details: e instanceof Error ? e.message : 'Unknown error',
          });
        }
      }

      // Attach verified payment data to request for downstream handlers
      (req as any).payment = paymentData;
      (req as any).paymentVerified = true;

      // Store successful payment verification for analytics
      await recordPaymentSuccess(paymentData, req.path);

      next();
    } catch (error) {
      logger.error('X402 paywall middleware error', error);
      return res.status(500).json({
        success: false,
        error: 'Payment verification system temporarily unavailable',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
};

/**
 * Calculate dynamic pricing based on resource and method
 */
function calculateResourcePrice(path: string, method: string): number {
  const basePrices: Record<string, number> = {
    // Agent operations
    '/api/agents/create': 0.05,
    '/api/agents/deploy': 0.10,
    '/api/agents/query': 0.01,
    
    // AI analysis endpoints
    '/api/ai/market-analysis': 0.02,
    '/api/ai/price-prediction': 0.03,
    '/api/ai/risk-assessment': 0.015,
    '/api/ai/opportunities': 0.025,
    
    // Trading operations
    '/api/trades/execute': 0.001,
    '/api/portfolio/performance': 0.005,
    
    // Premium features
    '/api/agents/backtest': 0.20,
    '/api/analytics/detailed': 0.15,
  };

  // Method-based multipliers
  const methodMultipliers: Record<string, number> = {
    'GET': 1.0,
    'POST': 1.5,
    'PUT': 1.2,
    'DELETE': 1.3,
  };

  const basePrice = basePrices[path] || 0.01; // Default $0.01
  const multiplier = methodMultipliers[method] || 1.0;
  
  return basePrice * multiplier;
}

/**
 * Get human-readable description for resource
 */
function getResourceDescription(path: string): string {
  const descriptions: Record<string, string> = {
    '/api/agents/create': 'Create new AI trading agent',
    '/api/agents/deploy': 'Deploy agent to live trading',
    '/api/agents/query': 'Query agent performance data',
    '/api/ai/market-analysis': 'AI-powered market sentiment analysis',
    '/api/ai/price-prediction': 'AI price prediction service',
    '/api/ai/risk-assessment': 'Portfolio risk assessment',
    '/api/ai/opportunities': 'Trading opportunity detection',
    '/api/trades/execute': 'Execute trading transaction',
    '/api/portfolio/performance': 'Portfolio performance analytics',
    '/api/agents/backtest': 'Strategy backtesting service',
    '/api/analytics/detailed': 'Detailed trading analytics',
  };

  return descriptions[path] || 'AI Agent Service';
}

/**
 * Get USDC contract address for the current network
 */
function getUSDCAddress(): string {
  const addresses: Record<string, string> = {
    'base-mainnet': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  };

  const network = config.cdp.network === 'base-sepolia' ? 'base-sepolia' : 'base-mainnet';
  return addresses[network] || addresses['base-sepolia'];
}

/**
 * Record successful payment for analytics and revenue tracking
 */
async function recordPaymentSuccess(paymentData: any, resource: string): Promise<void> {
  try {
    const record = {
      paymentData,
      resource,
      timestamp: new Date().toISOString(),
      protocol: 'x402',
      network: config.cdp.network,
    };

    logger.info('X402 payment success recorded', {
      resource,
      protocol: 'x402',
      network: config.cdp.network,
      timestamp: record.timestamp
    });
    
         // Store in Redis if available
    try {
       const key = `x402:payment:${Date.now()}:${resource.replace(/\//g, ':')}`;
       await redis.set(key, JSON.stringify(record)); // Store payment record
    } catch (redisError) {
      logger.warn('Redis payment logging failed, continuing...', { redisError });
    }
  } catch (error) {
    logger.error('Failed to record x402 payment success:', error);
    // Don't throw - this shouldn't block the request
  }
} 
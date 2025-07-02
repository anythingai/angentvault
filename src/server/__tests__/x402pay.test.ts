import { jest } from '@jest/globals';

// Mock environment variables before any imports
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.ENCRYPTION_KEY = 'test-encryption-key';
process.env.AWS_ACCESS_KEY_ID = 'test-aws-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-aws-secret';
process.env.CDP_API_KEY_ID = 'test-cdp-key';
process.env.CDP_API_KEY_SECRET = 'test-cdp-secret';
process.env.CDP_WALLET_ID = 'test-wallet';
process.env.PINATA_JWT = 'test-pinata-jwt';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.X402_PAY_API_KEY = 'test-x402-key';
process.env.X402_PAY_SECRET_KEY = 'test-x402-secret';
process.env.X402_PAY_WEBHOOK_SECRET = 'test-webhook-secret';
process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = 'test-walletconnect-id';
process.env.COINGECKO_API_KEY = 'test-coingecko-key';
process.env.ENABLE_DEMO_MODE = 'true';

jest.mock('@coinbase/x402', () => ({
  createPaymentRequiredResponse: jest.fn(() => ({ mock: true })),
  verifyExactPayment: jest.fn(() => true),
}));

import { X402PayService } from '../services/X402PayService';
import { CDPWalletService } from '../services/CDPWalletService';

describe('Services unit tests', () => {
  it('X402PayService should return default pricing for market_analysis', () => {
    const svc = new X402PayService();
    const pricing = (svc as any).getQueryPricing('market_analysis');
    expect(pricing).toEqual({ amount: 0.01, description: 'AI Market sentiment analysis' });
  });

  it('CDPWalletService testConnection returns object', async () => {
    const walletSvc = new CDPWalletService();
    const result = await walletSvc.testConnection();
    expect(result).toHaveProperty('success');
  });
}); 
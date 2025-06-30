import { jest } from '@jest/globals';

jest.mock('@coinbase/x402', () => ({
  createPaymentRequiredResponse: jest.fn(() => ({ mock: true })),
  verifyExactPayment: jest.fn(() => true),
}));

import { X402PayService } from '../services/X402PayService';
import { CDPWalletService } from '../services/CDPWalletService';

// Ensure required env variables so services don't throw
process.env.CDP_WALLET_ID = 'test-wallet';
process.env.ENABLE_DEMO_MODE = 'true';

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
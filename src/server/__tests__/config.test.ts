// Mock environment variables before importing config
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.ENCRYPTION_KEY = 'test-encryption-key';
process.env.AWS_ACCESS_KEY_ID = 'test-aws-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-aws-secret';
process.env.CDP_API_KEY_ID = 'test-cdp-key';
process.env.CDP_API_KEY_SECRET = 'test-cdp-secret';
process.env.CDP_WALLET_ID = 'test-wallet-id';
process.env.PINATA_JWT = 'test-pinata-jwt';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.X402_PAY_API_KEY = 'test-x402-key';
process.env.X402_PAY_SECRET_KEY = 'test-x402-secret';
process.env.X402_PAY_WEBHOOK_SECRET = 'test-webhook-secret';
process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = 'test-walletconnect-id';
process.env.COINGECKO_API_KEY = 'test-coingecko-key';

import { config } from '../config';

describe('Configuration', () => {
  it('should load configuration without throwing', () => {
    expect(config).toBeDefined();
    expect(config.server.port).toBe(4000);
  });

  it('should have all required security settings', () => {
    expect(config.security.jwtSecret).toBe('test-jwt-secret');
    expect(config.security.encryptionKey).toBe('test-encryption-key');
  });

  it('should have CDP configuration', () => {
    expect(config.cdp.apiKeyId).toBe('test-cdp-key');
    expect(config.cdp.apiKeySecret).toBe('test-cdp-secret');
    expect(config.cdp.walletId).toBe('test-wallet-id');
  });
}); 
import express from 'express';
import request from 'supertest';
import { paywallMiddleware } from '../middleware/paywall';

// Mock X402PayService so we control payment status
jest.mock('../services/X402PayService', () => {
  return {
    X402PayService: jest.fn().mockImplementation(() => {
      return {
        // For unknown payment id we return PENDING
        checkPaymentStatus: (id: string) => {
          if (id === 'completed') {
            return Promise.resolve({ status: 'COMPLETED' });
          }
          return Promise.resolve({ status: 'PENDING' });
        },
      };
    }),
  };
});

describe('paywallMiddleware', () => {
  const app = express();
  app.get('/protected', paywallMiddleware(), (_req, res) => {
    res.json({ success: true });
  });

  it('should respond with 402 when no payment id is provided', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(402);
  });

  it('should respond with 402 when payment is pending', async () => {
    const res = await request(app).get('/protected').set('x-payment-id', 'pending');
    expect(res.status).toBe(402);
  });

  it('should allow access when payment is completed', async () => {
    const res = await request(app).get('/protected').set('x-payment-id', 'completed');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
}); 
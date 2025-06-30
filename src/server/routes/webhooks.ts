import { Router } from 'express';
import { logger } from '../utils/logger';
import crypto from 'crypto';
import { config } from '../config';
import { db } from '../database';

const router = Router();

/**
 * x402pay webhook handler
 * Docs: https://docs.x402.org/webhooks
 * The webhook sends a POST request with JSON body and signature header:
 *   x402-signature: sha256=HMAC_SHA256(body, WEBHOOK_SECRET)
 */
router.post('/x402pay', expressRawBody, async (req, res) => {
  const signature = req.header('x402-signature') || '';
  const rawBody: Buffer = (req as any).rawBody;
  const expected = `sha256=${crypto
    .createHmac('sha256', config.x402pay.webhookSecret)
    .update(rawBody)
    .digest('hex')}`;

  if (signature !== expected) {
    logger.warn('Invalid x402pay webhook signature');
    return res.status(400).json({ success: false, error: 'Invalid signature' });
  }

  try {
    const event = JSON.parse(rawBody.toString());

    logger.info('x402pay webhook received', { id: event.id, type: event.type });

    // Handle payment.completed
    if (event.type === 'payment.completed') {
      const { paymentId, status, transactionHash } = event.data;
      // Update payment in DB
      await db.payment.update({
        where: { id: paymentId },
        data: {
          status: status.toUpperCase(),
          transactionHash,
        },
      });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('x402pay webhook processing failed', error);
    res.status(500).json({ success: false });
  }
});

// Helper middleware to grab raw body for signature verification
function expressRawBody(req: any, res: any, next: any) {
  req.setEncoding('utf8');
  let data = '';
  req.on('data', (chunk: string) => (data += chunk));
  req.on('end', () => {
    req.rawBody = Buffer.from(data);
    next();
  });
}

export default router; 
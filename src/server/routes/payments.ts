import { Router } from 'express';
import { db } from '../database';
import { logger } from '../utils/logger';
import { X402PayService } from '../services/X402PayService';
import { PaymentStatus, PaymentType } from '../../types';

const router = Router();
const paymentService = new X402PayService();

// Create payment request
router.post('/', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const { amount, currency, type, recipient, metadata } = req.body;
    const agentId = metadata?.agentId;

    if (!amount || !currency || !type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Amount, currency, and type are required',
      });
    }

    // Create payment record in database
    const payment = await db.payment.create({
      data: {
        userId,
        agentId,
        amount: parseFloat(amount),
        currency,
        type,
        status: PaymentStatus.PENDING,
        metadata: JSON.stringify(metadata || {}),
      },
    });

    // Process payment through x402pay
    const paymentRequest = await paymentService.createPaymentRequest({
      amount: parseFloat(amount),
      currency,
      recipient: recipient || 'default-recipient',
      metadata: {
        paymentId: payment.id,
        userId,
        ...metadata,
      },
    });

    // Update payment with x402pay reference
    const updatedPayment = await db.payment.update({
      where: { id: payment.id },
      data: { reference: paymentRequest.id },
    });

    res.status(201).json({
      success: true,
      data: {
        payment: updatedPayment,
        x402payRequest: paymentRequest,
      },
      message: 'Payment request created successfully',
    });

    logger.info('Payment request created:', { 
      paymentId: payment.id, 
      x402payId: paymentRequest.id,
      userId 
    });
  } catch (error) {
    logger.error('Failed to create payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get payment history
router.get('/', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const payments = await db.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const totalPayments = await db.payment.count({
      where: { userId },
    });

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page,
          limit,
          total: totalPayments,
          pages: Math.ceil(totalPayments / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Failed to fetch payment history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment history',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get specific payment
router.get('/:id', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const payment = await db.payment.findFirst({
      where: { id, userId },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
    }

    // If payment has x402pay reference, check status
    if (payment.reference) {
      try {
        const x402payStatus = await paymentService.checkPaymentStatus(payment.reference);
        
        // Update payment status if different
        if (x402payStatus.status !== payment.status) {
          await db.payment.update({
            where: { id: payment.id },
            data: { status: x402payStatus.status },
          });
        }
      } catch (error) {
        logger.warn('Failed to check x402pay status:', error);
      }
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    logger.error('Failed to fetch payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Process agent query payment
router.post('/agent-query', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const { agentId, queryType } = req.body;

    if (!agentId || !queryType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Agent ID and query type are required',
      });
    }

    // Get pricing from the service
    const pricing = paymentService.getQueryPricing(queryType);

    // Process payment through x402pay service
    const paymentResult = await paymentService.processAgentQuery(userId, agentId, queryType);

    // Create payment record
    const payment = await db.payment.create({
      data: {
        userId,
        agentId,
        amount: pricing.amount,
        currency: 'USDC',
        type: PaymentType.QUERY_FEE,
        status: PaymentStatus.PENDING,
        reference: paymentResult.id,
        metadata: JSON.stringify({
          agentId,
          queryType,
        }),
      },
    });

    res.json({
      success: true,
      data: {
        payment,
        paymentRequest: paymentResult,
      },
      message: 'Agent query payment processed',
    });

    logger.info('Agent query payment created:', { 
      paymentId: payment.id, 
      agentId, 
      queryType,
      userId 
    });
  } catch (error) {
    logger.error('Failed to process agent query payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process agent query payment',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router; 
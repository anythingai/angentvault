import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';
import { X402PayRequest, PaymentStatus, PaymentType } from '../../types';
import crypto from 'crypto';

export class X402PayService {
  private client: AxiosInstance;
  private webhookSecret: string;

  constructor() {
    this.client = axios.create({
      baseURL: config.x402pay.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.x402pay.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.webhookSecret = config.x402pay.webhookSecret;
  }

  async createPaymentRequest(request: X402PayRequest): Promise<any> {
    try {
      const response = await this.client.post('/v1/payments', {
        amount: request.amount,
        currency: request.currency,
        recipient: request.recipient,
        metadata: request.metadata,
        auto_settle: true,
        expires_in: 3600, // 1 hour
      });

      logger.info('Payment request created', {
        paymentId: response.data.id,
        amount: request.amount,
        currency: request.currency,
      });

      return response.data;
    } catch (error: unknown) {
      logger.error('Failed to create payment request:', error);
      const axiosError = error as any;
      throw new Error(`Payment request failed: ${axiosError.response?.data?.message || (error instanceof Error ? error.message : 'Unknown error')}`);
    }
  }

  async processAgentQuery(userId: string, agentId: string, queryType: string): Promise<any> {
    const pricing = this.getQueryPricing(queryType);
    
    const paymentRequest: X402PayRequest = {
      amount: pricing.amount,
      currency: 'USDC',
      recipient: await this.getAgentOwnerAddress(agentId),
      metadata: {
        type: PaymentType.QUERY_FEE,
        userId,
        agentId,
        queryType,
        timestamp: new Date().toISOString(),
      },
    };

    return this.createPaymentRequest(paymentRequest);
  }

  async processSubscription(userId: string, planType: string): Promise<any> {
    const pricing = this.getSubscriptionPricing(planType);
    
    const paymentRequest: X402PayRequest = {
      amount: pricing.amount,
      currency: 'USDC',
      recipient: config.x402pay.platformWallet,
      metadata: {
        type: PaymentType.SUBSCRIPTION,
        userId,
        planType,
        duration: pricing.duration,
        timestamp: new Date().toISOString(),
      },
    };

    return this.createPaymentRequest(paymentRequest);
  }

  async processRevenueShare(agentId: string, revenue: number): Promise<any> {
    const agentOwner = await this.getAgentOwnerAddress(agentId);
    const platformFee = revenue * 0.1; // 10% platform fee
    const ownerShare = revenue - platformFee;

    // Process payment to agent owner
    const ownerPayment: X402PayRequest = {
      amount: ownerShare,
      currency: 'USDC',
      recipient: agentOwner,
      metadata: {
        type: PaymentType.REVENUE_SHARE,
        agentId,
        totalRevenue: revenue,
        platformFee,
        timestamp: new Date().toISOString(),
      },
    };

    return this.createPaymentRequest(ownerPayment);
  }

  async checkPaymentStatus(paymentId: string): Promise<any> {
    try {
      const response = await this.client.get(`/v1/payments/${paymentId}`);
      
      logger.info('Payment status checked', {
        paymentId,
        status: response.data.status,
      });

      return response.data;
    } catch (error: unknown) {
      logger.error('Failed to check payment status:', error);
      throw new Error(`Payment status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async handleWebhook(payload: any, signature: string): Promise<boolean> {
    try {
      // Verify webhook signature
      const isValid = this.verifyWebhookSignature(payload, signature);
      if (!isValid) {
        logger.warn('Invalid webhook signature received');
        return false;
      }

      const { event_type, data } = payload;

      switch (event_type) {
        case 'payment.completed':
          await this.handlePaymentCompleted(data);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(data);
          break;
        case 'payment.refunded':
          await this.handlePaymentRefunded(data);
          break;
        default:
          logger.warn('Unknown webhook event type:', event_type);
      }

      return true;
    } catch (error: unknown) {
      logger.error('Webhook handling failed:', error);
      return false;
    }
  }

  private verifyWebhookSignature(payload: any, signature: string): boolean {
    const payloadString = JSON.stringify(payload);
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payloadString)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  private async handlePaymentCompleted(data: any): Promise<void> {
    const { id, metadata } = data;
    
    logger.info('Payment completed', { paymentId: id, metadata });

    // Update payment status in database
    await this.updatePaymentStatus(id, PaymentStatus.COMPLETED);

    // Process based on payment type
    switch (metadata.type) {
      case PaymentType.SUBSCRIPTION:
        await this.activateSubscription(metadata.userId, metadata.planType);
        break;
      case PaymentType.AGENT_ACCESS:
        await this.grantAgentAccess(metadata.userId, metadata.agentId);
        break;
      case PaymentType.QUERY_FEE:
        await this.processQueryPayment(metadata.userId, metadata.agentId, metadata.queryType);
        break;
    }
  }

  private async handlePaymentFailed(data: any): Promise<void> {
    const { id, reason } = data;
    
    logger.warn('Payment failed', { paymentId: id, reason });
    
    await this.updatePaymentStatus(id, PaymentStatus.FAILED);
  }

  private async handlePaymentRefunded(data: any): Promise<void> {
    const { id, amount } = data;
    
    logger.info('Payment refunded', { paymentId: id, amount });
    
    await this.updatePaymentStatus(id, PaymentStatus.REFUNDED);
  }

  private getQueryPricing(queryType: string): { amount: number; description: string } {
    const pricing = {
      market_analysis: { amount: 0.01, description: 'Market sentiment analysis' },
      price_prediction: { amount: 0.02, description: 'Price prediction query' },
      risk_assessment: { amount: 0.015, description: 'Portfolio risk assessment' },
      opportunity_detection: { amount: 0.025, description: 'Trading opportunity detection' },
      basic_query: { amount: 0.005, description: 'Basic agent query' },
    };

    return pricing[queryType] || pricing.basic_query;
  }

  private getSubscriptionPricing(planType: string): { amount: number; duration: string } {
    const pricing = {
      basic: { amount: 9.99, duration: 'monthly' },
      premium: { amount: 29.99, duration: 'monthly' },
      enterprise: { amount: 99.99, duration: 'monthly' },
    };

    return pricing[planType] || pricing.basic;
  }

  private async getAgentOwnerAddress(agentId: string): Promise<string> {
    // This would query the database to get the agent owner's wallet address
    // For now, return a placeholder
    return '0x742d35Cc6634C0532925a3b8D404d01A8dB9c0CF';
  }

  private async updatePaymentStatus(paymentId: string, status: PaymentStatus): Promise<void> {
    // Update payment status in database
    logger.info('Updating payment status', { paymentId, status });
  }

  private async activateSubscription(userId: string, planType: string): Promise<void> {
    // Activate user subscription
    logger.info('Activating subscription', { userId, planType });
  }

  private async grantAgentAccess(userId: string, agentId: string): Promise<void> {
    // Grant user access to agent
    logger.info('Granting agent access', { userId, agentId });
  }

  private async processQueryPayment(userId: string, agentId: string, queryType: string): Promise<void> {
    // Process successful query payment
    logger.info('Processing query payment', { userId, agentId, queryType });
  }

  // Utility method for autonomous agent payments
  async enableAutonomousPayments(agentId: string, walletAddress: string): Promise<any> {
    try {
      const response = await this.client.post('/v1/autonomous/enable', {
        agent_id: agentId,
        wallet_address: walletAddress,
        spending_limit: 100, // USDC
        auto_approve_threshold: 1, // Auto-approve payments under $1
        permitted_recipients: ['*'], // Allow payments to any recipient
      });

      logger.info('Autonomous payments enabled', {
        agentId,
        walletAddress,
      });

      return response.data;
    } catch (error: unknown) {
      logger.error('Failed to enable autonomous payments:', error);
      throw new Error(`Autonomous payment setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 
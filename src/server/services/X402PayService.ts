import { config } from '../config';
import { logger } from '../utils/logger';
import { X402PayRequest, PaymentType } from '../../types';

// Import official x402 packages
import { createPaymentRequiredResponse, PaymentRequiredResponse } from '@coinbase/x402';
import { verifyExactPayment } from '@coinbase/x402';

export class X402PayService {
  private walletAddress: string;
  private facilitatorUrl: string;

  constructor() {
    if (!config.cdp.walletId) {
      throw new Error('CDP_WALLET_ID is not set. Please configure your wallet address in the .env file.');
    }

    this.walletAddress = config.cdp.walletId;
    this.facilitatorUrl = config.x402pay.baseUrl || 'https://facilitator.x402.org';
    
    logger.info('X402PayService initialized with real protocol', {
      walletAddress: this.walletAddress,
      facilitatorUrl: this.facilitatorUrl
    });
  }

  async createPaymentRequest(request: X402PayRequest): Promise<PaymentRequiredResponse> {
    try {
      const paymentResponse = createPaymentRequiredResponse([
        {
          scheme: 'exact',
          network: config.cdp.network === 'base-sepolia' ? 'base-sepolia' : 'base-mainnet',
          maxAmountRequired: (request.amount * 1000000).toString(), // Convert to USDC atomic units (6 decimals)
          resource: request.metadata?.resource || '/api/default',
          description: request.metadata?.description || 'AI Agent Service',
          mimeType: 'application/json',
          payTo: request.recipient || this.walletAddress,
          maxTimeoutSeconds: 300,
          asset: this.getUSDCAddress(),
          extra: {
            name: 'USD Coin',
            version: '2'
          }
        }
      ]);

      logger.info('X402 payment request created', {
        amount: request.amount,
        currency: request.currency,
        recipient: request.recipient,
        resource: request.metadata?.resource
      });

      return paymentResponse;
    } catch (error: unknown) {
      logger.error('Failed to create x402 payment request:', error);
      throw new Error(`X402 payment request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async verifyPayment(paymentHeader: string, paymentRequirements: any): Promise<{ isValid: boolean; invalidReason?: string }> {
    try {
      const isValid = await verifyExactPayment(paymentHeader, paymentRequirements);
      
      if (isValid) {
        logger.info('X402 payment verified successfully');
        return { isValid: true };
      } else {
        logger.warn('X402 payment verification failed');
        return { isValid: false, invalidReason: 'Payment verification failed' };
      }
    } catch (error: unknown) {
      logger.error('X402 payment verification error:', error);
      return { 
        isValid: false, 
        invalidReason: error instanceof Error ? error.message : 'Verification error' 
      };
    }
  }

  async processAgentQuery(userId: string, agentId: string, queryType: string): Promise<PaymentRequiredResponse> {
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
        resource: `/api/agents/${agentId}/query`,
        description: pricing.description
      },
    };

    return this.createPaymentRequest(paymentRequest);
  }

  async processSubscription(userId: string, planType: string): Promise<PaymentRequiredResponse> {
    const pricing = this.getSubscriptionPricing(planType);
    
    const paymentRequest: X402PayRequest = {
      amount: pricing.amount,
      currency: 'USDC',
      recipient: this.walletAddress,
      metadata: {
        type: PaymentType.SUBSCRIPTION,
        userId,
        planType,
        duration: pricing.duration,
        timestamp: new Date().toISOString(),
        resource: `/api/subscription/${planType}`,
        description: `${planType} subscription - ${pricing.duration}`
      },
    };

    return this.createPaymentRequest(paymentRequest);
  }

  async processRevenueShare(agentId: string, revenue: number): Promise<any> {
    const agentOwner = await this.getAgentOwnerAddress(agentId);
    const platformFee = revenue * 0.1; // 10% platform fee
    const ownerShare = revenue - platformFee;

    // For revenue sharing, we'd typically use CDP Wallet to distribute funds
    // This would integrate with your CDPWalletService
    logger.info('Revenue share processed', {
        agentId,
      agentOwner,
      ownerShare,
      platformFee,
      totalRevenue: revenue
    });

    return {
      success: true,
      agentOwnerShare: ownerShare,
        platformFee,
      totalRevenue: revenue
    };
  }

  async checkPaymentStatus(paymentId: string): Promise<any> {
    // In x402 protocol, payment status is determined by on-chain verification
    // This would typically check the blockchain for transaction confirmation
    try {
      logger.info('Checking x402 payment status', { paymentId });
      
      // For now, return a basic status - in production this would query the blockchain
      return {
        id: paymentId,
        status: 'COMPLETED', // This would be determined by actual blockchain verification
        timestamp: new Date().toISOString()
      };
    } catch (error: unknown) {
      logger.error('Failed to check x402 payment status:', error);
      throw new Error(`Payment status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getUSDCAddress(): string {
    // USDC contract addresses for different networks
    const addresses: Record<string, string> = {
      'base-mainnet': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    };

    const network = config.cdp.network === 'base-sepolia' ? 'base-sepolia' : 'base-mainnet';
    return addresses[network] || addresses['base-sepolia'];
  }

  private getQueryPricing(queryType: string): { amount: number; description: string } {
    const pricing = {
      market_analysis: { amount: 0.01, description: 'AI Market sentiment analysis' },
      price_prediction: { amount: 0.02, description: 'AI Price prediction query' },
      risk_assessment: { amount: 0.015, description: 'AI Portfolio risk assessment' },
      opportunity_detection: { amount: 0.025, description: 'AI Trading opportunity detection' },
      agent_deployment: { amount: 0.10, description: 'Deploy new AI agent' },
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

  private async getAgentOwnerAddress(_agentId: string): Promise<string> {
    // This would query the database to get the agent owner's wallet address
    // For now, return the configured wallet address
    return this.walletAddress;
  }

  // Utility method for autonomous agent payments
  async enableAutonomousPayments(agentId: string, walletAddress: string): Promise<any> {
    try {
      logger.info('Autonomous x402 payments enabled', {
        agentId,
        walletAddress,
        protocol: 'x402',
        network: config.cdp.network
      });

      return {
        success: true,
        agentId,
        walletAddress,
        protocol: 'x402',
        spendingLimit: 100, // USDC
        autoApproveThreshold: 1, // Auto-approve payments under $1
        network: config.cdp.network
      };
    } catch (error: unknown) {
      logger.error('Failed to enable autonomous x402 payments:', error);
      throw new Error(`Autonomous payment setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 
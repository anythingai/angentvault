import { config } from '../config';
import { logger } from '../utils/logger';
import { WalletBalance, TradeType } from '../../types';

// Import CDP SDK with error handling
let Coinbase: any;
let Wallet: any;
try {
  const cdpSdk = require('@coinbase/coinbase-sdk');
  Coinbase = cdpSdk.Coinbase;
  Wallet = cdpSdk.Wallet;
  logger.info('CDP SDK loaded successfully', { 
    exports: Object.keys(cdpSdk),
    version: '0.20.0'
  });
} catch (e) {
  logger.error('CDP SDK module not found - production requires valid CDP SDK installation');
  throw new Error('CDP SDK is required for production deployment. Please install @coinbase/coinbase-sdk package.');
}

export class CDPWalletService {
  private cdp: any = null;
  private walletCache: Map<string, any> = new Map();

  constructor() {
    // Production requires valid CDP credentials
    const apiKeyName = config.cdp.apiKeyId;
    const privateKey = config.cdp.apiKeySecret;

    if (!apiKeyName || !privateKey) {
      throw new Error('CDP credentials are required for production. Set CDP_API_KEY_ID and CDP_API_KEY_SECRET environment variables.');
    }

    if (!Coinbase) {
      throw new Error('CDP SDK not available. Please install @coinbase/coinbase-sdk package.');
    }

    try {
      // Configure Coinbase with proper authentication
      Coinbase.configure(apiKeyName, privateKey);
      this.cdp = Coinbase;
      
      logger.info('CDP SDK initialized successfully', {
        apiKeyName: `${apiKeyName.substring(0, 8)}...`,
        network: config.cdp.network,
        apiVersion: require('@coinbase/coinbase-sdk/package.json').version,
      });
    } catch (error) {
      logger.error('CDP SDK initialization failed:', error);
      throw new Error(`CDP SDK initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Test connection - now required for production
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const wallets = await Wallet.list();
      return {
        success: true,
        message: `CDP connection successful. Found ${wallets.length} existing wallets.`
      };
    } catch (error) {
      return {
        success: false,
        message: `CDP connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async createWallet(userId: string): Promise<any> {
    try {
      const networkId = config.cdp.network || 'base-sepolia';
      const wallet = await Wallet.create({ networkId });
      
      // Cache the wallet for this user
      this.walletCache.set(userId, wallet);
      
      // Store wallet data securely
      await this.storeWalletData(userId, {
        walletId: wallet.id,
        addresses: wallet.addresses,
        network: networkId
      });
      
      logger.info('CDP wallet created successfully', {
        userId,
        walletId: wallet.id,
        addressCount: wallet.addresses?.length || 0
      });

      return wallet;
    } catch (error) {
      logger.error('Wallet creation failed', { userId, error });
      throw new Error(`Wallet creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getOrCreateWallet(userId: string): Promise<any> {
    // Check cache first
    if (this.walletCache.has(userId)) {
      return this.walletCache.get(userId);
    }

    // Try to import existing wallet
    const existingWallet = await this.importWallet(userId);
    if (existingWallet) {
      return existingWallet;
    }

    // Create new wallet
    return this.createWallet(userId);
  }

  async importWallet(userId: string): Promise<any> {
    try {
      const walletData = await this.getWalletData(userId);
      if (!walletData) {
        return null;
      }

      // Import real wallet using wallet ID
      const wallet = await Wallet.fetch(walletData.walletId);
      
      // Cache the wallet
      this.walletCache.set(userId, wallet);
      
      logger.info('Wallet imported successfully', {
        userId,
        walletId: wallet.id,
      });

      return wallet;
    } catch (error) {
      logger.error('Failed to import wallet:', error);
      throw new Error(`Wallet import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getBalance(userId: string, asset?: string): Promise<WalletBalance[]> {
    try {
      const wallet = await this.getOrCreateWallet(userId);
      const walletBalances: WalletBalance[] = [];

      // Get the default address
      const address = wallet.getDefaultAddress ? await wallet.getDefaultAddress() : wallet.addresses?.[0];
      
      if (!address) {
        throw new Error('No address found for wallet');
      }

      // Get balances using CDP SDK
      const balances = await address.listBalances?.() || [];
      
      for (const balance of balances) {
        if (!asset || balance.asset.symbol === asset) {
          const amount = parseFloat(balance.amount || '0');
          const usdValue = amount * (balance.asset?.usdPrice || 0);
        
          walletBalances.push({
            asset: balance.asset?.symbol || 'UNKNOWN',
            balance: amount,
            balanceUSD: usdValue,
          });
        }
      }

      logger.info('Balance retrieved successfully', {
        userId,
        balanceCount: walletBalances.length,
      });

      return walletBalances;
    } catch (error) {
      logger.error('Failed to get balance:', error);
      throw new Error(`Balance retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async executeTrade(
    userId: string,
    fromAsset: string,
    toAsset: string,
    amount: number,
    tradeType: TradeType
  ): Promise<any> {
    try {
      const wallet = await this.getOrCreateWallet(userId);
      
      // Execute real trade using CDP SDK
      const address = wallet.addresses[0];
      
      const trade = await address.createTrade({
        amount: amount.toString(),
        fromAssetId: fromAsset.toLowerCase(),
        toAssetId: toAsset.toLowerCase(),
      });

      // Wait for transaction to complete
      await trade.wait();

      logger.info('Trade executed successfully', {
        userId,
        fromAsset,
        toAsset,
        amount,
        tradeType,
        transactionHash: trade.transaction.transactionHash,
      });

      return {
        success: true,
        transactionHash: trade.transaction.transactionHash,
        fromAsset,
        toAsset,
        amount,
        executedAt: new Date(),
        price: trade.transaction.value || 0,
        usdValue: amount * (trade.transaction.value || 0),
      };
    } catch (error) {
      logger.error('Trade execution failed:', error);
      throw new Error(`Trade execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async transfer(
    userId: string,
    destinationAddress: string,
    amount: number,
    asset: string
  ): Promise<any> {
    try {
      const wallet = await this.getOrCreateWallet(userId);
      
      // Execute real transfer
      const address = wallet.addresses[0];
      
      const transfer = await address.createTransfer({
        amount: amount.toString(),
        assetId: asset.toLowerCase(),
        destination: destinationAddress,
        gasless: true, // Use gasless transfers when possible
      });

      await transfer.wait();

      logger.info('Transfer completed successfully', {
        userId,
        destinationAddress,
        amount,
        asset,
        transactionHash: transfer.transaction.transactionHash,
      });

      return {
        success: true,
        transactionHash: transfer.transaction.transactionHash,
        destinationAddress,
        amount,
        asset,
        executedAt: new Date(),
      };
    } catch (error) {
      logger.error('Transfer failed:', error);
      throw new Error(`Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTransactionHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const wallet = await this.getOrCreateWallet(userId);
      const transactions: any[] = [];
      
      // Get transactions from all addresses
      for (const address of wallet.addresses) {
        const addressTransactions = await address.listTransactions({ limit });
        
        transactions.push(...addressTransactions.map((tx: any) => ({
          hash: tx.transactionHash,
          from: tx.fromAddress,
          to: tx.toAddress,
          value: tx.value,
          timestamp: tx.blockTimestamp,
          status: tx.status,
          asset: tx.asset,
          amount: tx.amount,
        })));
      }

      // Sort by timestamp descending
      transactions.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return transactions.slice(0, limit);
    } catch (error) {
      logger.error('Failed to get transaction history:', error);
      throw new Error(`Transaction history retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async storeWalletData(userId: string, walletData: any): Promise<void> {
    try {
      // Store wallet data securely in database using Prisma
      const { db } = await import('../database');
      
      // Check if wallet already exists for this user
      const existingWallet = await db.wallet.findFirst({
        where: { userId },
      });

      if (existingWallet) {
        // Update existing wallet
        await db.wallet.update({
          where: { id: existingWallet.id },
          data: {
            walletId: walletData.walletId,
            addresses: JSON.stringify(walletData.addresses),
            network: walletData.network,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new wallet
        await db.wallet.create({
          data: {
            userId,
            walletId: walletData.walletId,
            addresses: JSON.stringify(walletData.addresses),
            network: walletData.network,
          },
        });
      }
      
      logger.info('Wallet data stored securely', { userId, walletId: walletData.walletId });
    } catch (error) {
      logger.error('Failed to store wallet data:', error);
      throw new Error(`Wallet data storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getWalletData(userId: string): Promise<any | null> {
    try {
      const { db } = await import('../database');
      const wallet = await db.wallet.findFirst({
        where: { userId },
      });

      if (!wallet) {
        return null;
      }

      return {
        walletId: wallet.walletId,
        addresses: JSON.parse(wallet.addresses),
        network: wallet.network,
      };
    } catch (error) {
      logger.error('Failed to retrieve wallet data:', error);
      return null;
    }
  }
} 
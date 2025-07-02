import { config } from '../config';
import { logger } from '../utils/logger';
import { WalletBalance, TradeType } from '../../types';

// Use dynamic import for CDP SDK to support ESM compatibility
let CdpClient: any;

export class CDPWalletService {
  private cdp: any = null;
  private walletCache: Map<string, any> = new Map();

  constructor() {
    this.initializeCDP();
  }

  private async initializeCDP() {
    try {
      // Dynamic import for ESM compatibility
      const cdpModule = await import('@coinbase/cdp-sdk');
      CdpClient = (cdpModule as any).CdpClient;

      // Use the new CDP SDK (v2)
      const apiKeyId = config.cdp.apiKeyId;
      const apiKeySecret = config.cdp.apiKeySecret;

      if (!apiKeyId || !apiKeySecret) {
        throw new Error('CDP credentials are required for production. Set CDP_API_KEY_ID and CDP_API_KEY_SECRET environment variables.');
      }

      this.cdp = new CdpClient({
        apiKeyId,
        apiKeySecret,
      });
      
      logger.info('CDP v2 SDK (CdpClient) initialized successfully', {
        apiKeyId: `${apiKeyId.substring(0, 8)}...`,
      });
    } catch (error) {
      logger.error('CDP v2 SDK initialization failed:', error);
      throw new Error(`CDP v2 SDK initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Test connection - now required for production
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Ensure CDP client is initialized
      await this.ensureCDPInitialized();
      
      // Try to create an EVM account (wallet)
      const account = await this.cdp.evm.createAccount();
      return {
        success: true,
        message: `CDP v2 connection successful. Created test account: ${account.getId()}`
      };
    } catch (error) {
      return {
        success: false,
        message: `CDP v2 connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Helper method to ensure CDP client is initialized
  private async ensureCDPInitialized(): Promise<void> {
    if (!this.cdp) {
      await this.initializeCDP();
    }
  }

  // Validate CDP credentials
  private async validateCredentials(): Promise<{ success: boolean; message: string }> {
    try {
      const apiKeyId = config.cdp.apiKeyId;
      const apiKeySecret = config.cdp.apiKeySecret;

      // Basic validation
      if (!apiKeyId || apiKeyId.length < 10) {
        return {
          success: false,
          message: 'Invalid CDP API Key ID format. Should be a UUID-like string.'
        };
      }

      if (!apiKeySecret || apiKeySecret.length < 20) {
        return {
          success: false,
          message: 'Invalid CDP API Key Secret format. Should be a base64-encoded string.'
        };
      }

      // Test if we can create a wallet (this will validate the credentials)
      try {
        await this.cdp.evm.createAccount();
        return {
          success: true,
          message: 'CDP credentials validated successfully.'
        };
      } catch (createError) {
        const errorMessage = createError instanceof Error ? createError.message : 'Unknown error';
        
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
          return {
            success: false,
            message: 'CDP API authentication failed. Please check your API key and secret.'
          };
        } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
          return {
            success: false,
            message: 'CDP API access denied. Please check your API key permissions.'
          };
        } else {
          return {
            success: false,
            message: `CDP credential validation failed: ${errorMessage}`
          };
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `Credential validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async createWallet(userId: string): Promise<any> {
    try {
      const networkId = config.cdp.network || 'base-sepolia';
      
      // Validate network ID
      if (!networkId || !['base-sepolia', 'base-mainnet'].includes(networkId)) {
        throw new Error(`Invalid network ID: ${networkId}. Must be 'base-sepolia' or 'base-mainnet'`);
      }

      logger.info('Attempting to create CDP wallet', {
        userId,
        networkId,
        apiKeyId: config.cdp.apiKeyId ? `${config.cdp.apiKeyId.substring(0, 8)}...` : 'NOT_SET'
      });

      // Create wallet with proper error handling
      const wallet = await this.cdp.evm.createAccount();
      
      if (!wallet || !wallet.getId()) {
        throw new Error('Wallet creation returned invalid wallet object');
      }
      
      // Cache the wallet for this user
      this.walletCache.set(userId, wallet);
      
      // Store wallet data securely
      await this.storeWalletData(userId, {
        walletId: wallet.getId(),
        addresses: wallet.getAddresses(),
        network: networkId
      });
      
      logger.info('CDP wallet created successfully', {
        userId,
        walletId: wallet.getId(),
        addressCount: wallet.getAddresses()?.length || 0
      });

      return wallet;
    } catch (error) {
      // Enhanced error logging for debugging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorName = error instanceof Error ? error.name : 'Unknown';
      
      logger.error('Wallet creation failed', { 
        userId, 
        error: {
          name: errorName,
          message: errorMessage,
          stack: error instanceof Error ? error.stack : undefined
        },
        config: {
          network: config.cdp.network,
          apiKeySet: !!config.cdp.apiKeyId,
          apiSecretSet: !!config.cdp.apiKeySecret
        }
      });
      
      // Provide more specific error messages
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        throw new Error('CDP API authentication failed. Please check your API key and secret.');
      } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        throw new Error('CDP API access denied. Please check your API key permissions.');
      } else if (errorMessage.includes('429') || errorMessage.includes('Rate limit')) {
        throw new Error('CDP API rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`Wallet creation failed: ${errorMessage}`);
      }
    }
  }

  async getOrCreateWallet(userId: string): Promise<any> {
    // Check cache first
    if (this.walletCache.has(userId)) {
      return this.walletCache.get(userId);
    }

    // Validate credentials before attempting wallet operations
    const credentialValidation = await this.validateCredentials();
    if (!credentialValidation.success) {
      throw new Error(`CDP credentials validation failed: ${credentialValidation.message}`);
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
      const wallet = await this.cdp.evm.createAccount({
        walletId: walletData.walletId,
        addresses: walletData.addresses,
        network: walletData.network,
      });
      
      // Cache the wallet
      this.walletCache.set(userId, wallet);
      
      logger.info('Wallet imported successfully', {
        userId,
        walletId: wallet.getId(),
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
      const address = wallet.getDefaultAddress ? await wallet.getDefaultAddress() : wallet.getAddresses()?.[0];
      
      if (!address) {
        throw new Error('No address found for wallet');
      }

      // Get balances using CDP SDK
      const balances = await address.listBalances?.() || [];
      
      for (const balance of balances) {
        if (!asset || balance.getAsset()?.getSymbol() === asset) {
          const amount = parseFloat(balance.getAmount() || '0');
          const usdValue = amount * (balance.getAsset()?.getUsdPrice() || 0);
        
          walletBalances.push({
            asset: balance.getAsset()?.getSymbol() || 'UNKNOWN',
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
      const address = wallet.getAddresses()[0];
      
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
        transactionHash: trade.getTransaction()?.getTransactionHash(),
      });

      return {
        success: true,
        transactionHash: trade.getTransaction()?.getTransactionHash(),
        fromAsset,
        toAsset,
        amount,
        executedAt: new Date(),
        price: trade.getTransaction()?.getValue() || 0,
        usdValue: amount * (trade.getTransaction()?.getValue() || 0),
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
      const address = wallet.getAddresses()[0];
      
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
        transactionHash: transfer.getTransaction()?.getTransactionHash(),
      });

      return {
        success: true,
        transactionHash: transfer.getTransaction()?.getTransactionHash(),
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
      for (const address of wallet.getAddresses()) {
        const addressTransactions = await address.listTransactions({ limit });
        
        transactions.push(...addressTransactions.map((tx: any) => ({
          hash: tx.getTransactionHash(),
          from: tx.getFromAddress(),
          to: tx.getToAddress(),
          value: tx.getValue(),
          timestamp: tx.getBlockTimestamp(),
          status: tx.getStatus(),
          asset: tx.getAsset(),
          amount: tx.getAmount(),
        })));
      }

      // Sort by timestamp descending
      transactions.sort((a, b) => 
        new Date(b.getTimestamp()).getTime() - new Date(a.getTimestamp()).getTime()
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
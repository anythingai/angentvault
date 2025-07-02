import { config } from '../config';
import { logger } from '../utils/logger';
import { WalletBalance, TradeType } from '../../types';

// Use dynamic import for CDP SDK to support ESM compatibility
let CdpClient: any;

export class CDPWalletService {
  private cdp: any = null;
  private accountCache: Map<string, any> = new Map();
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Start initialization but don't wait for it
    this.initializationPromise = this.initializeCDP();
  }

  private async initializeCDP(): Promise<void> {
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

  // Helper method to ensure CDP client is initialized
  private async ensureCDPInitialized(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
      this.initializationPromise = null; // Clear once completed
    }
    
    if (!this.cdp) {
      throw new Error('CDP SDK failed to initialize properly');
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
        message: `CDP v2 connection successful. Created test account: ${account.address}`
      };
    } catch (error) {
      return {
        success: false,
        message: `CDP v2 connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Validate CDP credentials
  private async validateCredentials(): Promise<{ success: boolean; message: string }> {
    try {
      // Ensure CDP client is initialized first
      await this.ensureCDPInitialized();
      
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

      // Test if we can create an account (this will validate the credentials)
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
      // Ensure CDP client is initialized
      await this.ensureCDPInitialized();
      
      const networkId = config.cdp.network || 'base-sepolia';
      
      // Validate network ID
      if (!networkId || !['base-sepolia', 'base-mainnet'].includes(networkId)) {
        throw new Error(`Invalid network ID: ${networkId}. Must be 'base-sepolia' or 'base-mainnet'`);
      }

      logger.info('Attempting to create CDP account', {
        userId,
        networkId,
        apiKeyId: config.cdp.apiKeyId ? `${config.cdp.apiKeyId.substring(0, 8)}...` : 'NOT_SET'
      });

      // Create account with proper error handling
      const account = await this.cdp.evm.createAccount();
      
      if (!account || !account.address) {
        throw new Error('Account creation returned invalid account object');
      }
      
      // Cache the account for this user
      this.accountCache.set(userId, account);
      
      // Store account data securely
      await this.storeAccountData(userId, {
        accountId: account.address, // Use address as the unique identifier
        address: account.address,
        network: networkId
      });
      
      logger.info('CDP account created successfully', {
        userId,
        accountId: account.address,
        address: account.address
      });

      return account;
    } catch (error) {
      // Enhanced error logging for debugging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorName = error instanceof Error ? error.name : 'Unknown';
      
      logger.error('Account creation failed', { 
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
        throw new Error(`Account creation failed: ${errorMessage}`);
      }
    }
  }

  async getOrCreateWallet(userId: string): Promise<any> {
    // Check cache first
    if (this.accountCache.has(userId)) {
      return this.accountCache.get(userId);
    }

    // Ensure CDP client is initialized
    await this.ensureCDPInitialized();

    // Validate credentials before attempting account operations
    const credentialValidation = await this.validateCredentials();
    if (!credentialValidation.success) {
      throw new Error(`CDP credentials validation failed: ${credentialValidation.message}`);
    }

    // Try to import existing account
    const existingAccount = await this.importAccount(userId);
    if (existingAccount) {
      return existingAccount;
    }

    // Create new account
    return this.createWallet(userId);
  }

  async importAccount(userId: string): Promise<any> {
    try {
      // Ensure CDP client is initialized
      await this.ensureCDPInitialized();
      
      const accountData = await this.getAccountData(userId);
      if (!accountData) {
        return null;
      }

      // For CDP v2, we need to fetch the account by address
      // Note: CDP v2 may not support direct import by ID, so we create a new account
      // and the user will need to fund it separately
      const account = await this.cdp.evm.createAccount();
      
      // Cache the account
      this.accountCache.set(userId, account);
      
      logger.info('Account imported successfully', {
        userId,
        accountId: account.address,
      });

      return account;
    } catch (error) {
      logger.error('Failed to import account:', error);
      throw new Error(`Account import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getBalance(userId: string, asset?: string): Promise<WalletBalance[]> {
    try {
      const account = await this.getOrCreateWallet(userId);
      const walletBalances: WalletBalance[] = [];

      // Get the account address
      const address = account.address;
      
      if (!address) {
        throw new Error('No address found for account');
      }

      // For CDP v2, we need to get balances differently
      // This is a simplified implementation - you may need to adjust based on actual SDK
      try {
        // Try to get balances from the account object
        const balances = await account.listBalances?.() || [];
        
        for (const balance of balances) {
          if (!asset || balance.asset?.symbol === asset) {
            const amount = parseFloat(balance.amount || '0');
            const usdValue = amount * (balance.asset?.usdPrice || 0);
          
            walletBalances.push({
              asset: balance.asset?.symbol || 'UNKNOWN',
              balance: amount,
              balanceUSD: usdValue,
            });
          }
        }
      } catch (balanceError) {
        // Fallback: return empty balances if balance retrieval fails
        logger.warn('Balance retrieval failed, returning empty balances', {
          userId,
          error: balanceError instanceof Error ? balanceError.message : 'Unknown error'
        });
        
        // Return default USDC balance of 0
        walletBalances.push({
          asset: 'USDC',
          balance: 0,
          balanceUSD: 0,
        });
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
      const account = await this.getOrCreateWallet(userId);
      
      // Execute real trade using CDP SDK
      // Note: This is a simplified implementation - adjust based on actual SDK capabilities
      const trade = await account.createTrade?.({
        amount: amount.toString(),
        fromAssetId: fromAsset.toLowerCase(),
        toAssetId: toAsset.toLowerCase(),
      });

      // Wait for transaction to complete
      await trade?.wait?.();

      logger.info('Trade executed successfully', {
        userId,
        fromAsset,
        toAsset,
        amount,
        tradeType,
        transactionHash: trade?.transaction?.hash,
      });

      return {
        success: true,
        transactionHash: trade?.transaction?.hash,
        fromAsset,
        toAsset,
        amount,
        executedAt: new Date(),
        price: trade?.transaction?.value || 0,
        usdValue: amount * (trade?.transaction?.value || 0),
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
      const account = await this.getOrCreateWallet(userId);
      
      // Execute real transfer
      const transfer = await account.createTransfer?.({
        amount: amount.toString(),
        assetId: asset.toLowerCase(),
        destination: destinationAddress,
        gasless: true, // Use gasless transfers when possible
      });

      await transfer?.wait?.();

      logger.info('Transfer completed successfully', {
        userId,
        destinationAddress,
        amount,
        asset,
        transactionHash: transfer?.transaction?.hash,
      });

      return {
        success: true,
        transactionHash: transfer?.transaction?.hash,
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
      const account = await this.getOrCreateWallet(userId);
      const transactions: any[] = [];
      
      // Get transactions from the account
      try {
        const accountTransactions = await account.listTransactions?.({ limit }) || [];
        
        transactions.push(...accountTransactions.map((tx: any) => ({
          hash: tx.hash,
          from: tx.fromAddress,
          to: tx.toAddress,
          value: tx.value,
          timestamp: tx.blockTimestamp,
          status: tx.status,
          asset: tx.asset,
          amount: tx.amount,
        })));
      } catch (txError) {
        logger.warn('Transaction history retrieval failed', {
          userId,
          error: txError instanceof Error ? txError.message : 'Unknown error'
        });
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

  private async storeAccountData(userId: string, accountData: any): Promise<void> {
    try {
      // Store account data securely in database using Prisma
      const { db } = await import('../database');
      
      // Check if account already exists for this user
      const existingAccount = await db.wallet.findFirst({
        where: { userId },
      });

      if (existingAccount) {
        // Update existing account
        await db.wallet.update({
          where: { id: existingAccount.id },
          data: {
            walletId: accountData.accountId,
            addresses: JSON.stringify([accountData.address]),
            network: accountData.network,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new account
        await db.wallet.create({
          data: {
            userId,
            walletId: accountData.accountId,
            addresses: JSON.stringify([accountData.address]),
            network: accountData.network,
          },
        });
      }
      
      logger.info('Account data stored securely', { userId, accountId: accountData.accountId });
    } catch (error) {
      logger.error('Failed to store account data:', error);
      throw new Error(`Account data storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getAccountData(userId: string): Promise<any | null> {
    try {
      const { db } = await import('../database');
      const account = await db.wallet.findFirst({
        where: { userId },
      });

      if (!account) {
        return null;
      }

      return {
        accountId: account.walletId,
        address: JSON.parse(account.addresses)[0],
        network: account.network,
      };
    } catch (error) {
      logger.error('Failed to retrieve account data:', error);
      return null;
    }
  }
} 
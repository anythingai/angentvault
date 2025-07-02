import dotenv from 'dotenv';
import { AppConfig } from '../../types';

// Load environment variables
dotenv.config();

// Validate required environment variables for production
function validateRequiredEnvVars() {
  const isProduction = process.env.NODE_ENV === 'production';
  const requiredVars = [
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'CDP_API_KEY_ID',
    'CDP_API_KEY_SECRET',
    'CDP_WALLET_ID',
    'PINATA_JWT',
    'DATABASE_URL',
    // REDIS_URL is only required in production
    // 'REDIS_URL',
    'X402_PAY_WEBHOOK_SECRET',
    'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID',
    'COINGECKO_API_KEY',
  ];
  if (isProduction) {
    requiredVars.push('REDIS_URL');
  }
  const missingVars = requiredVars.filter((key) => !process.env[key]);
  if (missingVars.length > 0) {
    // Fail fast regardless of NODE_ENV – running without secrets is never safe
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

// Validate environment variables
validateRequiredEnvVars();

export const config: AppConfig = {
  server: {
    port: parseInt(process.env.PORT || '4000'),
    environment: process.env.NODE_ENV || 'development',
    apiUrl: process.env.API_URL || 'http://localhost:4000',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/agentvault',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
    ssl: process.env.NODE_ENV === 'production',
  },
  cache: {
    maxKeys: parseInt(process.env.CACHE_MAX_KEYS || '100000'),
    ttlDefault: parseInt(process.env.CACHE_TTL_DEFAULT || '3600'), // 1 hour default
    checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD || '600'), // 10 minutes
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    bedrockModelId: process.env.BEDROCK_MODEL_ID || 'amazon.nova-lite-v1:0',
  },
  cdp: {
    // New SDK field names
    apiKeyId: process.env.CDP_API_KEY_ID || '',
    apiKeySecret: process.env.CDP_API_KEY_SECRET || '',

    // Back-compat fields used in parts of the code we haven't migrated yet
    apiKeyName: process.env.CDP_API_KEY_ID || '',
    privateKey: process.env.CDP_API_KEY_SECRET || '',

    baseUrl: process.env.CDP_BASE_URL || 'https://api.coinbase.com',
    network: process.env.CDP_NETWORK || 'base-sepolia',
    walletId: process.env.CDP_WALLET_ID || '',
  },
  x402pay: {
    env: process.env.X402_PAY_ENV || 'sandbox',
    baseUrl:
      process.env.X402_PAY_BASE_URL ||
      ((process.env.X402_PAY_ENV || 'sandbox') === 'production'
        ? 'https://api.x402.dev/v1'
        : 'https://facilitator.x402.org'),
    webhookSecret: process.env.X402_PAY_WEBHOOK_SECRET || '',
    platformWallet: process.env.X402PAY_PLATFORM_WALLET || '',
    enabled: process.env.X402_PAY_ENABLED !== 'false', // Enabled by default
  },
  pinata: {
    apiKey: process.env.PINATA_API_KEY || '',
    secretApiKey: process.env.PINATA_SECRET_API_KEY || '',
    gateway: process.env.PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud',
    jwt: process.env.PINATA_JWT || '',
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || (() => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET must be set in production');
      }
      return 'dev-jwt-secret-not-for-production';
    })(),
    encryptionKey: process.env.ENCRYPTION_KEY || (() => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('ENCRYPTION_KEY must be set in production');
      }
      return 'dev-encryption-key-not-for-production';
    })(),
    corsOrigin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
  features: {
    enablePaperTrading: process.env.ENABLE_PAPER_TRADING === 'true',
    enableRealTrading: process.env.ENABLE_REAL_TRADING === 'true',
    enableWebSocket: process.env.ENABLE_WEBSOCKET !== 'false',
  },
  agent: {
    executionInterval: parseInt(process.env.AGENT_EXECUTION_INTERVAL || '60000'),
    maxTradeSize: parseInt(process.env.AGENT_MAX_TRADE_SIZE || '1000'),
    defaultSlippage: parseFloat(process.env.AGENT_DEFAULT_SLIPPAGE || '0.02'),
    maxDailyTrades: parseInt(process.env.AGENT_MAX_DAILY_TRADES || '50'),
  },
  marketData: {
    coingeckoApiKey: process.env.COINGECKO_API_KEY,
    coinmarketcapApiKey: process.env.COINMARKETCAP_API_KEY,
  },
};

export const port = config.server.port; 
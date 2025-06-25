import dotenv from 'dotenv';
import { AppConfig } from '../../types';

// Load environment variables
dotenv.config();

export const config: AppConfig = {
  server: {
    port: parseInt(process.env.PORT || '4000'),
    environment: process.env.NODE_ENV || 'development',
    apiUrl: process.env.API_URL || 'http://localhost:4000',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  },
  database: {
    url: process.env.DATABASE_URL || 'file:./dev.db',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
    ssl: process.env.NODE_ENV === 'production',
  },
  redis: {
    url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
    maxRetries: 3,
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    bedrockModelId: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  },
  cdp: {
    apiKeyName: process.env.CDP_API_KEY || '',
    privateKey: process.env.CDP_PRIVATE_KEY || '',
    baseUrl: process.env.CDP_BASE_URL || 'https://api.coinbase.com',
    network: process.env.CDP_NETWORK || 'base-sepolia',
    walletId: process.env.CDP_WALLET_ID,
  },
  x402pay: {
    apiKey: process.env.X402_PAY_API_KEY || '',
    secretKey: process.env.X402_PAY_SECRET_KEY || '',
    baseUrl: process.env.X402_PAY_BASE_URL || 'https://api.x402.org',
    webhookSecret: process.env.X402_PAY_WEBHOOK_SECRET || '',
    platformWallet: process.env.X402PAY_PLATFORM_WALLET || '',
    enabled: process.env.X402_PAY_ENABLED === 'true',
  },
  pinata: {
    apiKey: process.env.PINATA_API_KEY || '',
    secretApiKey: process.env.PINATA_SECRET_API_KEY || '',
    gateway: process.env.PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud',
    jwt: process.env.PINATA_JWT || '',
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret-change-in-production',
    encryptionKey: process.env.ENCRYPTION_KEY || 'default-encryption-key',
    corsOrigin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
  features: {
    enableDemoMode: process.env.ENABLE_DEMO_MODE === 'true',
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

// Validate required environment variables in production
const requiredEnvVars = [
  'JWT_SECRET',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'CDP_API_KEY',
  'CDP_PRIVATE_KEY',
  'X402_PAY_API_KEY',
  'X402_PAY_SECRET_KEY',
  'X402_PAY_WEBHOOK_SECRET',
  'PINATA_API_KEY',
  'PINATA_SECRET_API_KEY',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0 && process.env.NODE_ENV === 'production') {
  // console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
} else if (missingEnvVars.length > 0) {
  // console.warn('Missing environment variables (using defaults):', missingEnvVars);
}

export const port = config.server.port; 
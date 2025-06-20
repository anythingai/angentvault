import dotenv from 'dotenv';
import { AppConfig } from '../../types';

// Load environment variables
dotenv.config();

export const config: AppConfig = {
  server: {
    port: parseInt(process.env.PORT || '8000'),
    environment: process.env.NODE_ENV || 'development',
  },
  database: {
    url: process.env.DATABASE_URL || 'file:./dev.db',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
    ssl: process.env.NODE_ENV === 'production',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    bedrockModelId: process.env.BEDROCK_MODEL_ID || 'amazon.nova-pro-v1:0',
  },
  cdp: {
    apiKeyName: process.env.CDP_API_KEY_NAME || '',
    privateKey: process.env.CDP_PRIVATE_KEY || '',
    baseUrl: process.env.CDP_BASE_URL || 'https://api.coinbase.com',
  },
  x402pay: {
    apiKey: process.env.X402PAY_API_KEY || '',
    baseUrl: process.env.X402PAY_BASE_URL || 'https://api.x402.org',
    webhookSecret: process.env.X402PAY_WEBHOOK_SECRET || '',
    platformWallet: process.env.X402PAY_PLATFORM_WALLET || '',
  },
  pinata: {
    apiKey: process.env.PINATA_API_KEY || '',
    secretApiKey: process.env.PINATA_SECRET_KEY || '',
    jwt: process.env.PINATA_JWT || '',
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret-change-in-production',
    encryptionKey: process.env.ENCRYPTION_KEY || 'default-encryption-key',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
};

// Validate required environment variables (relaxed for development)
const requiredEnvVars = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'CDP_API_KEY_NAME',
  'CDP_PRIVATE_KEY'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

export const port = parseInt(process.env.PORT || '8000'); 
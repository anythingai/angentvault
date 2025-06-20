// Core Agent Types
export interface Agent {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  status: AgentStatus;
  config: AgentConfig;
  performance: AgentPerformance;
  createdAt: Date;
  updatedAt: Date;
}

export enum AgentStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  ERROR = 'error',
}

export interface AgentConfig {
  riskTolerance: RiskLevel;
  maxInvestmentAmount: number;
  tradingPairs: string[];
  strategies: TradingStrategy[];
  stopLossPercentage: number;
  takeProfitPercentage: number;
  rebalanceFrequency: number;
}

export enum RiskLevel {
  CONSERVATIVE = 'conservative',
  MODERATE = 'moderate',
  AGGRESSIVE = 'aggressive',
}

export interface TradingStrategy {
  id: string;
  name: string;
  type: StrategyType;
  parameters: Record<string, any>;
  enabled: boolean;
}

export enum StrategyType {
  MOMENTUM = 'momentum',
  MEAN_REVERSION = 'mean_reversion',
  ARBITRAGE = 'arbitrage',
  SENTIMENT_ANALYSIS = 'sentiment_analysis',
  DCA = 'dollar_cost_averaging',
}

// Performance and Analytics Types
export interface AgentPerformance {
  totalReturn: number;
  totalReturnPercentage: number;
  dailyReturn: number;
  weeklyReturn: number;
  monthlyReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  profitableTrades: number;
  lastUpdated: Date;
}

export interface Trade {
  id: string;
  agentId: string;
  type: TradeType;
  symbol: string;
  amount: number;
  price: number;
  fee: number;
  status: TradeStatus;
  executedAt?: Date;
  createdAt: Date;
}

export enum TradeType {
  BUY = 'buy',
  SELL = 'sell',
}

export enum TradeStatus {
  PENDING = 'pending',
  EXECUTED = 'executed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// Market Data Types
export interface MarketData {
  symbol: string;
  price: number;
  volume24h: number;
  change24h: number;
  changePercentage24h: number;
  marketCap: number;
  timestamp: Date;
}

export interface CandlestickData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// User and Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  walletAddress: string;
  isVerified: boolean;
  subscription: SubscriptionPlan;
  createdAt: Date;
  updatedAt: Date;
}

export enum SubscriptionPlan {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

// Wallet and Payment Types
export interface Wallet {
  id: string;
  address: string;
  userId: string;
  balance: WalletBalance[];
  isActive: boolean;
  network: string;
}

export interface WalletBalance {
  asset: string;
  balance: number;
  balanceUSD: number;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  type: PaymentType;
  status: PaymentStatus;
  transactionHash?: string;
  createdAt: Date;
}

export enum PaymentType {
  SUBSCRIPTION = 'subscription',
  AGENT_ACCESS = 'agent_access',
  QUERY_FEE = 'query_fee',
  REVENUE_SHARE = 'revenue_share',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

// AI and Analysis Types
export interface AIAnalysis {
  id: string;
  agentId: string;
  type: AnalysisType;
  input: Record<string, any>;
  output: Record<string, any>;
  confidence: number;
  reasoning: string;
  createdAt: Date;
}

export enum AnalysisType {
  MARKET_SENTIMENT = 'market_sentiment',
  PRICE_PREDICTION = 'price_prediction',
  RISK_ASSESSMENT = 'risk_assessment',
  OPPORTUNITY_DETECTION = 'opportunity_detection',
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// WebSocket Types
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: Date;
}

export enum WebSocketEventType {
  AGENT_STATUS_UPDATE = 'agent_status_update',
  TRADE_EXECUTED = 'trade_executed',
  MARKET_DATA_UPDATE = 'market_data_update',
  BALANCE_UPDATE = 'balance_update',
  PRICE_ALERT = 'price_alert',
}

// Third-party Integration Types
export interface BedrockRequest {
  modelId: string;
  prompt: string;
  maxTokens: number;
  temperature: number;
  tools?: BedrockTool[];
}

export interface BedrockTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

export interface X402PayRequest {
  amount: number;
  currency: string;
  recipient: string;
  metadata?: Record<string, any>;
}

export interface PinataUploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

// Configuration Types
export interface AppConfig {
  server: ServerConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  aws: AWSConfig;
  cdp: CDPConfig;
  x402pay: X402PayConfig;
  pinata: PinataConfig;
  security: SecurityConfig;
}

export interface ServerConfig {
  port: number;
  environment: string;
}

export interface DatabaseConfig {
  url: string;
  maxConnections: number;
  ssl: boolean;
}

export interface RedisConfig {
  url: string;
  maxRetries: number;
}

export interface AWSConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bedrockModelId: string;
}

export interface CDPConfig {
  apiKeyName: string;
  privateKey: string;
  baseUrl: string;
}

export interface X402PayConfig {
  apiKey: string;
  baseUrl: string;
  webhookSecret: string;
  platformWallet: string;
}

export interface PinataConfig {
  apiKey: string;
  secretApiKey: string;
  jwt: string;
}

export interface SecurityConfig {
  jwtSecret: string;
  encryptionKey: string;
  corsOrigin: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
} 
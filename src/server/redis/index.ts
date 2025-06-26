import { createClient } from 'redis';
import { config } from '../config';
import { logger } from '../utils/logger';

class Redis {
  private client: any;
  private isConnected: boolean = false;
  private mockStorage: Map<string, string> = new Map();

  constructor() {
    try {
    this.client = createClient({
      url: config.redis.url,
    });

    this.client.on('error', (err: any) => {
        logger.warn('Redis Client Error (falling back to memory cache):', err.code || err.message);
        this.isConnected = false;
    });

    this.client.on('connect', () => {
      logger.info('Redis client connected');
        this.isConnected = true;
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
        this.isConnected = true;
    });
    } catch (error) {
      logger.warn('Redis initialization failed, using memory cache:', error);
      this.client = null;
    }
  }

  async connect(): Promise<void> {
    if (!this.client) {
      logger.info('Redis not available, using memory cache for local development');
      return;
    }

    try {
      await this.client.connect();
      this.isConnected = true;
      logger.info('Redis connected successfully');
    } catch (error) {
      logger.warn('Redis connection failed, falling back to memory cache:', error);
      this.isConnected = false;
      // Don't throw error - just use memory cache
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
      logger.info('Redis disconnected successfully');
    } catch (error) {
      logger.error('Redis disconnection failed:', error);
      throw error;
    }
  }

  getClient() {
    return this.client;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.isConnected || !this.client) {
      // Use memory cache as fallback
      this.mockStorage.set(key, value);
      if (ttl) {
        // Simulate TTL with setTimeout
        setTimeout(() => {
          this.mockStorage.delete(key);
        }, ttl * 1000);
      }
      return;
    }

    try {
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.warn('Redis set failed, using memory cache:', error);
      this.mockStorage.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.isConnected || !this.client) {
      // Use memory cache as fallback
      return this.mockStorage.get(key) || null;
    }

    try {
      return await this.client.get(key);
    } catch (error) {
      logger.warn('Redis get failed, using memory cache:', error);
      return this.mockStorage.get(key) || null;
    }
  }

  async del(key: string): Promise<number> {
    if (!this.isConnected || !this.client) {
      // Use memory cache as fallback
      const existed = this.mockStorage.has(key);
      this.mockStorage.delete(key);
      return existed ? 1 : 0;
    }

    try {
      return await this.client.del(key);
    } catch (error) {
      logger.warn('Redis del failed, using memory cache:', error);
      const existed = this.mockStorage.has(key);
      this.mockStorage.delete(key);
      return existed ? 1 : 0;
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      // Memory cache is always "healthy"
      return true;
    }

    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.warn('Redis health check failed, using memory cache:', error);
      return true; // Memory cache fallback is available
    }
  }
}

export const redis = new Redis(); 
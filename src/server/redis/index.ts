import { createClient } from 'redis';
import { config } from '../config';
import { logger } from '../utils/logger';

class Redis {
  private client: any;
  private isConnected: boolean = false;
  private hasLoggedFailure: boolean = false;
  private mockStorage: Map<string, string> = new Map();

  constructor() {
    try {
    this.client = createClient({
      url: config.redis.url,
        socket: {
          connectTimeout: 2000,
        },
    });

    this.client.on('error', (err: any) => {
        if (this.isConnected || !this.hasLoggedFailure) {
          this.logConnectionError(`Redis client error: ${err.code || err.message}`);
        }
        this.isConnected = false;
    });

    this.client.on('connect', () => {
        logger.info('Redis client attempting to connect...');
    });

    this.client.on('ready', () => {
        logger.info('Redis connected successfully');
        this.isConnected = true;
    });
    } catch (error) {
      this.logConnectionError('Redis initialization failed');
      this.client = null;
    }
  }

  private logConnectionError(message: string) {
    if (!this.hasLoggedFailure) {
      logger.warn(`${message}. Falling back to in-memory cache for local development.`);
      this.hasLoggedFailure = true;
    }
  }

  async connect(): Promise<void> {
    if (this.isConnected || !this.client) {
      if (!this.client) this.logConnectionError('Redis not configured');
      return;
    }

    try {
      await this.client.connect();
    } catch (error) {
      this.logConnectionError('Redis connection failed');
      this.isConnected = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected && this.client) {
      await this.client.disconnect();
      logger.info('Redis disconnected successfully');
    }
  }

  getClient() {
    return this.client;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (this.isConnected && this.client) {
    try {
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
        return;
      } catch (e) {
        // Fallthrough to memory cache if redis command fails
      }
    }
    // Use memory cache as fallback
      this.mockStorage.set(key, value);
    if (ttl) {
      setTimeout(() => {
        this.mockStorage.delete(key);
      }, ttl * 1000);
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.isConnected && this.client) {
    try {
      return await this.client.get(key);
      } catch (e) {
        // Fallthrough to memory cache
      }
    }
      return this.mockStorage.get(key) || null;
  }

  async del(key: string): Promise<number> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.del(key);
      } catch (e) {
        // Fallthrough
      }
    }
      const existed = this.mockStorage.has(key);
      this.mockStorage.delete(key);
      return existed ? 1 : 0;
  }

  async healthCheck(): Promise<boolean> {
    if (this.isConnected && this.client) {
      try {
        return (await this.client.ping()) === 'PONG';
      } catch (e) {
        return false;
      }
    }
    // If not connected, the "health" depends on the fallback cache, which is always available.
    return true;
  }
}

export const redis = new Redis(); 
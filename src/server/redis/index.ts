import NodeCache from 'node-cache';
import { config } from '../config';
import { logger } from '../utils/logger';

class NodeCacheAdapter {
  private cache: NodeCache;
  private isConnected: boolean = true; // Always connected for in-memory
  private hasLoggedInfo: boolean = false;

  constructor() {
    // Initialize node-cache with settings from config
    this.cache = new NodeCache({
      stdTTL: config.cache.ttlDefault,
      checkperiod: config.cache.checkPeriod,
      useClones: true, // Clone objects for safety
      deleteOnExpire: true, // Clean up expired keys
      maxKeys: config.cache.maxKeys, // Set max keys from config
    });

    this.logInfo('NodeCache initialized as Redis alternative for production');
  }

  private logInfo(message: string) {
    if (!this.hasLoggedInfo) {
      logger.info(`${message}. Using fast in-memory cache with node-cache.`);
      this.hasLoggedInfo = true;
    }
  }

  async connect(): Promise<void> {
    // Always connected for in-memory cache
    if (!this.hasLoggedInfo) {
      this.logInfo('NodeCache ready');
    }
  }

  async disconnect(): Promise<void> {
    this.cache.flushAll();
    logger.info('NodeCache disconnected and flushed');
  }

  getClient() {
    return this.cache; // Return the cache instance
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        this.cache.set(key, value, ttl);
      } else {
        this.cache.set(key, value);
      }
    } catch (error) {
      logger.error('NodeCache set error:', error);
      throw error;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      const value = this.cache.get<string>(key);
      return value !== undefined ? value : null;
    } catch (error) {
      logger.error('NodeCache get error:', error);
      return null;
    }
  }

  async del(key: string): Promise<number> {
    try {
      const deleted = this.cache.del(key);
      return deleted;
    } catch (error) {
      logger.error('NodeCache del error:', error);
      return 0;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Test basic functionality
      const testKey = 'health-check-test';
      const testValue = 'ok';
      this.cache.set(testKey, testValue, 1); // 1 second TTL
      const retrieved = this.cache.get(testKey);
      this.cache.del(testKey);
      return retrieved === testValue;
    } catch (error) {
      logger.error('NodeCache health check failed:', error);
      return false;
    }
  }

  // Additional utility methods for better Redis compatibility
  async exists(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  async keys(pattern?: string): Promise<string[]> {
    const allKeys = this.cache.keys();
    if (!pattern || pattern === '*') {
      return allKeys;
    }
    // Simple pattern matching for Redis-like behavior
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return allKeys.filter(key => regex.test(key));
  }

  async flushAll(): Promise<void> {
    this.cache.flushAll();
  }

  // Get cache statistics
  getStats() {
    return this.cache.getStats();
  }

  // Get current key count
  getKeyCount(): number {
    return this.cache.keys().length;
  }

  // Memory usage estimation (basic)
  getMemoryUsage(): { keys: number, estimatedSize: string } {
    const stats = this.cache.getStats();
    return {
      keys: stats.keys,
      estimatedSize: `${Math.round((stats.ksize + stats.vsize) / 1024)} KB`
    };
  }
}

export const redis = new NodeCacheAdapter(); 
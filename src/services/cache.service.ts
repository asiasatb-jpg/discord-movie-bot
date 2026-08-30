import Redis from 'ioredis';
import { env } from '../config/env.config.js';
import { logger } from '../utils/logger.js';

interface MemoryCacheItem<T> {
  value: T;
  expiresAt: number;
}

export class CacheService {
  private redis: Redis | null = null;
  private memoryCache = new Map<string, MemoryCacheItem<any>>();
  private isRedisConnected = false;

  constructor() {
    if (env.REDIS_URL) {
      try {
        this.redis = new Redis(env.REDIS_URL, {
          lazyConnect: true,
          maxRetriesPerRequest: 2,
          retryStrategy(times) {
            if (times > 3) {
              logger.warn('Redis reconnection failed after 3 attempts. Falling back to in-memory cache.');
              return null;
            }
            return Math.min(times * 100, 2000);
          },
        });

        this.redis.on('connect', () => {
          this.isRedisConnected = true;
          logger.info('Connected to Redis server.');
        });

        this.redis.on('error', (err) => {
          this.isRedisConnected = false;
          logger.warn({ err: err.message }, 'Redis error, utilizing in-memory cache fallback.');
        });

        this.redis.connect().catch((err) => {
          this.isRedisConnected = false;
          logger.warn({ err: err.message }, 'Could not establish initial Redis connection. Memory cache active.');
        });
      } catch (err: any) {
        logger.warn({ err: err.message }, 'Failed to initialize Redis client. Using in-memory cache.');
      }
    } else {
      logger.info('No REDIS_URL configured. Using high-performance in-memory cache.');
    }

    // Periodic cleanup of expired memory cache entries every 5 minutes
    setInterval(() => this.cleanupMemoryCache(), 5 * 60 * 1000).unref();
  }

  /**
   * Get cached item by key
   */
  public async get<T>(key: string): Promise<T | null> {
    if (this.isRedisConnected && this.redis) {
      try {
        const data = await this.redis.get(key);
        if (data) {
          return JSON.parse(data) as T;
        }
      } catch (err: any) {
        logger.debug({ err: err.message }, 'Redis get error, checking memory cache.');
      }
    }

    const item = this.memoryCache.get(key);
    if (item) {
      if (Date.now() > item.expiresAt) {
        this.memoryCache.delete(key);
        return null;
      }
      return item.value as T;
    }

    return null;
  }

  /**
   * Set cached item with TTL (in seconds)
   */
  public async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const serialized = JSON.stringify(value);

    if (this.isRedisConnected && this.redis) {
      try {
        await this.redis.set(key, serialized, 'EX', ttlSeconds);
      } catch (err: any) {
        logger.debug({ err: err.message }, 'Redis set error, caching in memory.');
      }
    }

    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Delete item by key or pattern
   */
  public async del(key: string): Promise<void> {
    if (this.isRedisConnected && this.redis) {
      try {
        await this.redis.del(key);
      } catch (err: any) {
        logger.debug({ err: err.message }, 'Redis del error.');
      }
    }
    this.memoryCache.delete(key);
  }

  /**
   * Clear all cache
   */
  public async clearAll(): Promise<void> {
    if (this.isRedisConnected && this.redis) {
      try {
        await this.redis.flushdb();
      } catch (err: any) {
        logger.warn({ err: err.message }, 'Failed to flush Redis DB.');
      }
    }
    this.memoryCache.clear();
  }

  /**
   * Garbage collect expired memory cache items
   */
  private cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, item] of this.memoryCache.entries()) {
      if (now > item.expiresAt) {
        this.memoryCache.delete(key);
      }
    }
  }
}

export const cacheService = new CacheService();

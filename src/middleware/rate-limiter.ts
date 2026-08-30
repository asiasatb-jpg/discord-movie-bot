import { env } from '../config/env.config.js';
import { cacheService } from '../services/cache.service.js';

interface RateLimitResult {
  isLimited: boolean;
  remainingSeconds?: number;
  remainingRequests: number;
}

export class RateLimiter {
  private windowSizeInSeconds = 60;
  private maxRequests: number;

  constructor(maxRequests = env.RATE_LIMIT_PER_MINUTE) {
    this.maxRequests = maxRequests;
  }

  /**
   * Checks if user has exceeded rate limit.
   */
  public async checkLimit(userId: string): Promise<RateLimitResult> {
    const key = `ratelimit:${userId}`;
    const now = Date.now();

    const record = (await cacheService.get<{ timestamps: number[] }>(key)) || {
      timestamps: [],
    };

    // Filter out timestamps outside the sliding window
    const windowStart = now - this.windowSizeInSeconds * 1000;
    const validTimestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (validTimestamps.length >= this.maxRequests) {
      const oldestValid = validTimestamps[0];
      const remainingSeconds = Math.max(
        1,
        Math.ceil((oldestValid + this.windowSizeInSeconds * 1000 - now) / 1000)
      );

      return {
        isLimited: true,
        remainingSeconds,
        remainingRequests: 0,
      };
    }

    // Add current timestamp and save
    validTimestamps.push(now);
    await cacheService.set(key, { timestamps: validTimestamps }, this.windowSizeInSeconds);

    return {
      isLimited: false,
      remainingRequests: this.maxRequests - validTimestamps.length,
    };
  }

  /**
   * Reset rate limit for a user
   */
  public async resetLimit(userId: string): Promise<void> {
    await cacheService.del(`ratelimit:${userId}`);
  }
}

export const rateLimiter = new RateLimiter();

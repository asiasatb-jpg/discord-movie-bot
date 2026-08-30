import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter } from '../src/middleware/rate-limiter.js';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter(3); // 3 requests max for testing
  });

  it('should allow requests within the limit', async () => {
    const user = 'test_user_1';
    await limiter.resetLimit(user);

    const r1 = await limiter.checkLimit(user);
    expect(r1.isLimited).toBe(false);
    expect(r1.remainingRequests).toBe(2);

    const r2 = await limiter.checkLimit(user);
    expect(r2.isLimited).toBe(false);
    expect(r2.remainingRequests).toBe(1);

    const r3 = await limiter.checkLimit(user);
    expect(r3.isLimited).toBe(false);
    expect(r3.remainingRequests).toBe(0);
  });

  it('should block requests exceeding the limit', async () => {
    const user = 'test_user_2';
    await limiter.resetLimit(user);

    await limiter.checkLimit(user);
    await limiter.checkLimit(user);
    await limiter.checkLimit(user);

    const r4 = await limiter.checkLimit(user);
    expect(r4.isLimited).toBe(true);
    expect(r4.remainingSeconds).toBeGreaterThan(0);
  });
});

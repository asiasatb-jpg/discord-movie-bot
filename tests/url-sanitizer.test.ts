import { describe, it, expect } from 'vitest';
import { sanitizeUrl } from '../src/utils/url-sanitizer.js';

describe('URL Sanitizer & Anti-Ad / Anti-Affiliate Guard', () => {
  it('should strip tracking and UTM query parameters', () => {
    const dirtyUrl = 'https://www.netflix.com/title/70136122?utm_source=bot&utm_medium=discord&utm_campaign=promo';
    const result = sanitizeUrl(dirtyUrl);

    expect(result.isValid).toBe(true);
    expect(result.cleanUrl).toBe('https://www.netflix.com/title/70136122');
  });

  it('should strip affiliate and referral query parameters', () => {
    const dirtyUrl = 'https://www.primevideo.com/detail/0S301Q5?ref=bot123&affiliate_id=999&click_id=xyz';
    const result = sanitizeUrl(dirtyUrl);

    expect(result.isValid).toBe(true);
    expect(result.cleanUrl).toBe('https://www.primevideo.com/detail/0S301Q5');
  });

  it('should block known ad-shortener and link-locking redirect domains', () => {
    expect(sanitizeUrl('https://bit.ly/3xXyZ').isValid).toBe(false);
    expect(sanitizeUrl('https://adf.ly/12345').isValid).toBe(false);
    expect(sanitizeUrl('https://ouo.io/movie123').isValid).toBe(false);
    expect(sanitizeUrl('https://shorte.st/abcd').isValid).toBe(false);
    expect(sanitizeUrl('https://linkvertise.com/123/movie').isValid).toBe(false);
  });

  it('should preserve clean canonical streaming URLs', () => {
    const cleanUrl = 'https://www.disneyplus.com/movies/interstellar/12345';
    const result = sanitizeUrl(cleanUrl);

    expect(result.isValid).toBe(true);
    expect(result.cleanUrl).toBe('https://www.disneyplus.com/movies/interstellar/12345');
  });

  it('should preserve necessary official query parameters while removing tracking', () => {
    const youtubeUrl = 'https://www.youtube.com/watch?v=zSWdZVtXT7E&utm_source=share&fbclid=abcdef';
    const result = sanitizeUrl(youtubeUrl);

    expect(result.isValid).toBe(true);
    expect(result.cleanUrl).toBe('https://www.youtube.com/watch?v=zSWdZVtXT7E');
  });
});

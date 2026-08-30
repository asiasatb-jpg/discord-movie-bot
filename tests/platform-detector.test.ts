import { describe, it, expect } from 'vitest';
import { platformDetector } from '../src/providers/platform-detector.js';

describe('Platform Detector', () => {
  it('should detect Netflix URLs correctly', () => {
    const res = platformDetector.detect('https://www.netflix.com/title/70136122');
    expect(res.isSupported).toBe(true);
    expect(res.platformName).toBe('Netflix');
    expect(res.extractedId).toBe('70136122');
  });

  it('should detect Amazon Prime Video URLs correctly', () => {
    const res = platformDetector.detect('https://www.primevideo.com/detail/0S301Q5NV9J8Z');
    expect(res.isSupported).toBe(true);
    expect(res.platformName).toBe('Amazon Prime Video');
    expect(res.extractedId).toBe('0S301Q5NV9J8Z');
  });

  it('should detect Disney+ URLs correctly', () => {
    const res = platformDetector.detect('https://www.disneyplus.com/movies/interstellar/4k294');
    expect(res.isSupported).toBe(true);
    expect(res.platformName).toBe('Disney+');
    expect(res.searchQueryHint).toBe('interstellar');
  });

  it('should detect YouTube URLs correctly', () => {
    const res = platformDetector.detect('https://www.youtube.com/watch?v=zSWdZVtXT7E');
    expect(res.isSupported).toBe(true);
    expect(res.platformName).toBe('YouTube Movies');
    expect(res.extractedId).toBe('zSWdZVtXT7E');
  });

  it('should reject unsupported or pirate domains', () => {
    const res = platformDetector.detect('https://pirate-streaming-site.com/movie/123');
    expect(res.isSupported).toBe(false);
  });
});

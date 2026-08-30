import { describe, it, expect } from 'vitest';
import { isSafeUrl } from '../src/utils/ssrf.validator.js';

describe('SSRF Validator', () => {
  it('should allow valid public HTTPS streaming URLs', () => {
    expect(isSafeUrl('https://www.netflix.com/title/70136122').isValid).toBe(true);
    expect(isSafeUrl('https://www.disneyplus.com/movies/interstellar/123').isValid).toBe(true);
    expect(isSafeUrl('https://www.primevideo.com/detail/0S301Q5').isValid).toBe(true);
    expect(isSafeUrl('https://www.youtube.com/watch?v=zSWdZVtXT7E').isValid).toBe(true);
  });

  it('should block localhost and local domain names', () => {
    expect(isSafeUrl('http://localhost:3000/test').isValid).toBe(false);
    expect(isSafeUrl('http://127.0.0.1:8080/admin').isValid).toBe(false);
    expect(isSafeUrl('https://internal.corp/secret').isValid).toBe(false);
    expect(isSafeUrl('http://router.local').isValid).toBe(false);
  });

  it('should block private IPv4 address ranges', () => {
    expect(isSafeUrl('http://10.0.0.1/dashboard').isValid).toBe(false);
    expect(isSafeUrl('http://172.16.0.1/api').isValid).toBe(false);
    expect(isSafeUrl('http://192.168.1.1/admin').isValid).toBe(false);
    expect(isSafeUrl('http://169.254.169.254/latest/meta-data/').isValid).toBe(false);
    expect(isSafeUrl('http://0.0.0.0').isValid).toBe(false);
  });

  it('should block private IPv6 address ranges', () => {
    expect(isSafeUrl('http://[::1]:8080').isValid).toBe(false);
    expect(isSafeUrl('http://[fe80::1]').isValid).toBe(false);
    expect(isSafeUrl('http://[fc00::1]').isValid).toBe(false);
  });

  it('should reject invalid or non-http protocols', () => {
    expect(isSafeUrl('ftp://example.com/movie.mp4').isValid).toBe(false);
    expect(isSafeUrl('file:///etc/passwd').isValid).toBe(false);
    expect(isSafeUrl('javascript:alert(1)').isValid).toBe(false);
    expect(isSafeUrl('not a url').isValid).toBe(false);
  });
});

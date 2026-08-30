import { describe, it, expect, vi } from 'vitest';
import { extractYear, formatRuntime, formatRating } from '../src/utils/formatters.js';

describe('Formatters & Transformation Helpers', () => {
  it('should extract year from ISO date format', () => {
    expect(extractYear('2014-11-07')).toBe(2014);
    expect(extractYear('1999-03-31')).toBe(1999);
    expect(extractYear(undefined)).toBeUndefined();
  });

  it('should format runtime in hours and minutes', () => {
    expect(formatRuntime(169)).toBe('2h 49m');
    expect(formatRuntime(60)).toBe('1h');
    expect(formatRuntime(45)).toBe('45m');
    expect(formatRuntime(undefined)).toBe('N/A');
  });

  it('should format rating string correctly', () => {
    expect(formatRating(8.65, 23000)).toBe('⭐ 8.7/10 (23.0k votes)');
    expect(formatRating(7.0, 500)).toBe('⭐ 7.0/10 (500 votes)');
    expect(formatRating(0)).toBe('⭐ N/A');
  });
});

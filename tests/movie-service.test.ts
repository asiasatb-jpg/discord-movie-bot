import { describe, it, expect } from 'vitest';
import { GENRE_MAP } from '../src/services/movie.service.js';

describe('MovieService Constants & Genre Maps', () => {
  it('should map genre names to correct TMDB Genre IDs', () => {
    expect(GENRE_MAP['action']).toBe(28);
    expect(GENRE_MAP['adventure']).toBe(12);
    expect(GENRE_MAP['animation']).toBe(16);
    expect(GENRE_MAP['comedy']).toBe(35);
    expect(GENRE_MAP['drama']).toBe(18);
    expect(GENRE_MAP['sci-fi']).toBe(878);
    expect(GENRE_MAP['thriller']).toBe(53);
  });
});

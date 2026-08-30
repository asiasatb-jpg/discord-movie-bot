import { MovieProvider } from './base.provider.js';
import { tmdbProvider } from './tmdb.provider.js';
import { platformDetector } from './platform-detector.js';
import { Movie, MovieSearchResult, WatchLink, PlatformDetectionResult } from '../types/movie.types.js';
import { logger } from '../utils/logger.js';

export class ProviderManager {
  private providers: Map<string, MovieProvider> = new Map();
  private defaultProvider: MovieProvider;

  constructor() {
    this.defaultProvider = tmdbProvider;
    this.registerProvider('tmdb', tmdbProvider);
  }

  /**
   * Register a new MovieProvider
   */
  public registerProvider(key: string, provider: MovieProvider): void {
    this.providers.set(key.toLowerCase(), provider);
    logger.info(`Provider registered: ${provider.name} [${key}]`);
  }

  /**
   * Get provider by key
   */
  public getProvider(key = 'tmdb'): MovieProvider {
    return this.providers.get(key.toLowerCase()) || this.defaultProvider;
  }

  /**
   * List all registered providers
   */
  public listProviders(): { key: string; name: string }[] {
    const list: { key: string; name: string }[] = [];
    for (const [key, provider] of this.providers.entries()) {
      list.push({ key, name: provider.name });
    }
    return list;
  }

  /**
   * Search movies across default provider
   */
  public async search(query: string, limit = 10): Promise<MovieSearchResult[]> {
    return this.defaultProvider.search(query, limit);
  }

  /**
   * Get movie details by ID
   */
  public async getMovie(id: string, region?: string): Promise<Movie | null> {
    return this.defaultProvider.getMovie(id, region);
  }

  /**
   * Get watch links for a movie ID
   */
  public async getWatchLinks(id: string, region?: string): Promise<WatchLink[]> {
    return this.defaultProvider.getWatchLinks(id, region);
  }

  /**
   * Resolves a URL to detect legal platform and find movie if possible
   */
  public async resolveUrl(
    rawUrl: string
  ): Promise<{ detection: PlatformDetectionResult; movie: Movie | null }> {
    const detection = platformDetector.detect(rawUrl);
    if (!detection.isSupported) {
      return { detection, movie: null };
    }

    let movie: Movie | null = null;

    // If we extracted a title hint, search in TMDB
    if (detection.searchQueryHint) {
      const searchResults = await this.search(detection.searchQueryHint, 1);
      if (searchResults.length > 0) {
        movie = await this.getMovie(searchResults[0].id);
      }
    }

    return { detection, movie };
  }
}

export const providerManager = new ProviderManager();

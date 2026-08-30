import { providerManager } from '../providers/provider-manager.js';
import { tmdbProvider } from '../providers/tmdb.provider.js';
import { cacheService } from './cache.service.js';
import { CACHE_TTL } from '../config/constants.js';
import { Movie, MovieSearchResult, WatchLink } from '../types/movie.types.js';
import { logger } from '../utils/logger.js';

export const GENRE_MAP: Record<string, number> = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  'sci-fi': 878,
  'science fiction': 878,
  thriller: 53,
  war: 10752,
  western: 37,
};

export class MovieService {
  /**
   * Search movies with caching
   */
  public async search(query: string, limit = 10): Promise<MovieSearchResult[]> {
    const cacheKey = `search:${query.toLowerCase().trim()}:${limit}`;
    const cached = await cacheService.get<MovieSearchResult[]>(cacheKey);
    if (cached) return cached;

    const results = await providerManager.search(query, limit);
    if (results.length > 0) {
      await cacheService.set(cacheKey, results, CACHE_TTL.SEARCH_RESULTS);
    }
    return results;
  }

  /**
   * Get full movie details with caching
   */
  public async getMovieDetails(id: string, region?: string): Promise<Movie | null> {
    const cacheKey = `movie:${id}:${region || 'default'}`;
    const cached = await cacheService.get<Movie>(cacheKey);
    if (cached) return cached;

    const movie = await providerManager.getMovie(id, region);
    if (movie) {
      await cacheService.set(cacheKey, movie, CACHE_TTL.MOVIE_DETAILS);
    }
    return movie;
  }

  /**
   * Resolve movie by query or ID
   */
  public async resolveMovie(queryOrId: string, region?: string): Promise<Movie | null> {
    // If it is a direct numerical TMDB ID
    if (/^\d+$/.test(queryOrId.trim())) {
      const movie = await this.getMovieDetails(queryOrId.trim(), region);
      if (movie) return movie;
    }

    // Search by title and get details of the first match
    const searchResults = await this.search(queryOrId, 1);
    if (searchResults.length > 0) {
      return this.getMovieDetails(searchResults[0].id, region);
    }

    return null;
  }

  /**
   * Get legal watch links for movie
   */
  public async getWatchLinks(id: string, region?: string): Promise<WatchLink[]> {
    const movie = await this.getMovieDetails(id, region);
    return movie ? movie.watchLinks : [];
  }

  /**
   * Autocomplete search for slash commands
   */
  public async getAutocompleteSuggestions(query: string): Promise<{ name: string; value: string }[]> {
    if (!query || query.trim().length === 0) return [];

    const cacheKey = `autocomplete:${query.toLowerCase().trim()}`;
    const cached = await cacheService.get<{ name: string; value: string }[]>(cacheKey);
    if (cached) return cached;

    const results = await providerManager.search(query, 25);
    const suggestions = results.map((m) => ({
      name: `${m.title}${m.year ? ` (${m.year})` : ''}`.slice(0, 100),
      value: m.id,
    }));

    await cacheService.set(cacheKey, suggestions, CACHE_TTL.AUTOCOMPLETE);
    return suggestions;
  }

  /**
   * Get trending movies
   */
  public async getTrending(): Promise<MovieSearchResult[]> {
    const cacheKey = 'trending:day';
    const cached = await cacheService.get<MovieSearchResult[]>(cacheKey);
    if (cached) return cached;

    const results = await tmdbProvider.getTrending('day');
    await cacheService.set(cacheKey, results, CACHE_TTL.TRENDING);
    return results;
  }

  /**
   * Get top rated movies
   */
  public async getTopRated(): Promise<MovieSearchResult[]> {
    const cacheKey = 'top_rated';
    const cached = await cacheService.get<MovieSearchResult[]>(cacheKey);
    if (cached) return cached;

    const results = await tmdbProvider.getTopRated();
    await cacheService.set(cacheKey, results, CACHE_TTL.TRENDING);
    return results;
  }

  /**
   * Get a random popular movie
   */
  public async getRandomMovie(): Promise<Movie | null> {
    const trending = await this.getTrending();
    if (trending.length === 0) return null;
    const randomItem = trending[Math.floor(Math.random() * trending.length)];
    return this.getMovieDetails(randomItem.id);
  }

  /**
   * Discover movies by genre name
   */
  public async discoverByGenre(genreName: string): Promise<MovieSearchResult[]> {
    const genreId = GENRE_MAP[genreName.toLowerCase().trim()];
    if (!genreId) return [];
    return tmdbProvider.discover({ with_genres: genreId });
  }

  /**
   * Discover movies by release year
   */
  public async discoverByYear(year: number): Promise<MovieSearchResult[]> {
    return tmdbProvider.discover({ primary_release_year: year });
  }

  /**
   * Discover movies by Actor name
   */
  public async discoverByActor(actorName: string): Promise<{ actorName: string; movies: MovieSearchResult[] } | null> {
    const person = await tmdbProvider.searchPerson(actorName);
    if (!person) return null;
    const movies = await tmdbProvider.discover({ with_cast: person.id });
    return { actorName: person.name, movies };
  }

  /**
   * Discover movies by Director name
   */
  public async discoverByDirector(directorName: string): Promise<{ directorName: string; movies: MovieSearchResult[] } | null> {
    const person = await tmdbProvider.searchPerson(directorName);
    if (!person) return null;
    const movies = await tmdbProvider.discover({ with_crew: person.id });
    return { directorName: person.name, movies };
  }

  /**
   * Get recommendations based on movie
   */
  public async getRecommendations(queryOrId: string): Promise<{ baseMovie: Movie; recommendations: MovieSearchResult[] } | null> {
    const movie = await this.resolveMovie(queryOrId);
    if (!movie) return null;
    const recommendations = await tmdbProvider.getRecommendations(movie.id);
    return { baseMovie: movie, recommendations };
  }
}

export const movieService = new MovieService();

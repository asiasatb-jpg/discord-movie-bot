import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env.config.js';
import { logger } from '../utils/logger.js';
import {
  Movie,
  MovieSearchResult,
  WatchLink,
  CastMember,
  VideoTrailer,
  WatchProviderCountry,
} from '../types/movie.types.js';
import { MovieProvider } from './base.provider.js';
import { POSTER_SIZE, BACKDROP_SIZE } from '../config/constants.js';
import { extractYear } from '../utils/formatters.js';
import { sanitizeUrl } from '../utils/url-sanitizer.js';

export class TmdbProvider implements MovieProvider {
  public readonly name = 'The Movie Database (TMDB)';
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.themoviedb.org/3',
      timeout: 10000,
      params: {
        api_key: env.TMDB_API_KEY,
      },
    });
  }

  /**
   * Search movies by query
   */
  public async search(query: string, limit = 10): Promise<MovieSearchResult[]> {
    try {
      const response = await this.client.get('/search/movie', {
        params: {
          query,
          include_adult: false,
          language: 'id-ID',
          page: 1,
        },
      });

      const results = response.data.results || [];
      return results.slice(0, limit).map((item: any) => ({
        id: String(item.id),
        title: item.title,
        year: extractYear(item.release_date),
        rating: item.vote_average || 0,
        posterUrl: item.poster_path ? `${POSTER_SIZE.MEDIUM}${item.poster_path}` : undefined,
        overview: item.overview || '',
      }));
    } catch (err: any) {
      logger.error({ err: err.message, query }, 'TMDB search error');
      return [];
    }
  }

  /**
   * Get full movie details by ID
   */
  public async getMovie(id: string, region = env.TMDB_DEFAULT_REGION): Promise<Movie | null> {
    try {
      const response = await this.client.get(`/movie/${id}`, {
        params: {
          language: 'id-ID',
          append_to_response: 'credits,videos,watch/providers,release_dates',
        },
      });

      const data = response.data;
      if (!data || !data.id) return null;

      // Extract Cast
      const cast: CastMember[] = (data.credits?.cast || []).slice(0, 8).map((c: any) => ({
        id: c.id,
        name: c.name,
        character: c.character,
        profilePath: c.profile_path ? `${POSTER_SIZE.SMALL}${c.profile_path}` : null,
        order: c.order,
      }));

      // Extract Directors
      const directors: string[] = (data.credits?.crew || [])
        .filter((cr: any) => cr.job === 'Director')
        .map((cr: any) => cr.name);

      // Extract Trailers (Official YouTube Trailers prioritized)
      let videos: any[] = data.videos?.results || [];
      
      // If no trailers in local language, fetch global trailers
      if (videos.length === 0) {
        try {
          const videoRes = await this.client.get(`/movie/${id}/videos`, {
            params: { language: 'en-US' },
          });
          videos = videoRes.data.results || [];
        } catch {
          // Ignore
        }
      }

      const trailers: VideoTrailer[] = videos
        .filter((v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))
        .map((v: any) => {
          const rawTrailerUrl = `https://www.youtube.com/watch?v=${v.key}`;
          const sanitized = sanitizeUrl(rawTrailerUrl);
          return {
            id: v.id,
            name: v.name,
            key: v.key,
            site: v.site,
            type: v.type,
            official: v.official ?? false,
            publishedAt: v.published_at,
            url: sanitized.cleanUrl || rawTrailerUrl,
          };
        });

      // Prefer official trailer, otherwise fallback to first available or youtube search
      const officialTrailer = trailers.find((t) => t.official) || trailers[0];

      // Extract Watch Providers for Region (e.g. ID or US fallback)
      const watchProvidersData = data['watch/providers']?.results || {};
      const regionalProviders: WatchProviderCountry =
        watchProvidersData[region] || watchProvidersData['US'] || {};

      const watchLinks: WatchLink[] = [];

      const addSanitizedLink = (
        name: string,
        type: 'flatrate' | 'buy' | 'rent' | 'free' | 'official_site',
        rawUrl: string,
        logoPath?: string | null
      ) => {
        const sanitized = sanitizeUrl(rawUrl);
        if (sanitized.isValid && sanitized.cleanUrl && !sanitized.isShortener) {
          if (!watchLinks.some((w) => w.providerName === name)) {
            watchLinks.push({
              providerName: name,
              providerType: type,
              url: sanitized.cleanUrl,
              logoUrl: logoPath ? `${POSTER_SIZE.SMALL}${logoPath}` : undefined,
            });
          }
        }
      };

      // JustWatch main link for the movie
      if (regionalProviders.link) {
        addSanitizedLink(
          'JustWatch Stream Portal',
          'official_site',
          regionalProviders.link
        );
      }

      // Flatrate / Subscription (Netflix, Disney+, Prime Video, etc.)
      if (regionalProviders.flatrate) {
        for (const item of regionalProviders.flatrate) {
          const fallbackUrl =
            regionalProviders.link ||
            data.homepage ||
            `https://www.themoviedb.org/movie/${data.id}/watch`;
          addSanitizedLink(item.provider_name, 'flatrate', fallbackUrl, item.logo_path);
        }
      }

      // Buy / Rent providers
      if (regionalProviders.buy) {
        for (const item of regionalProviders.buy) {
          const fallbackUrl =
            regionalProviders.link || `https://www.themoviedb.org/movie/${data.id}/watch`;
          addSanitizedLink(item.provider_name, 'buy', fallbackUrl, item.logo_path);
        }
      }

      // Free / Ads providers
      if (regionalProviders.free) {
        for (const item of regionalProviders.free) {
          const fallbackUrl =
            regionalProviders.link || `https://www.themoviedb.org/movie/${data.id}/watch`;
          addSanitizedLink(item.provider_name, 'free', fallbackUrl, item.logo_path);
        }
      }

      // Movie Homepage if present
      if (data.homepage) {
        addSanitizedLink('Official Website', 'official_site', data.homepage);
      }

      return {
        id: String(data.id),
        provider: 'tmdb',
        title: data.title,
        originalTitle: data.original_title,
        tagline: data.tagline,
        overview: data.overview || '',
        releaseDate: data.release_date,
        year: extractYear(data.release_date),
        runtime: data.runtime,
        rating: data.vote_average || 0,
        voteCount: data.vote_count || 0,
        genres: (data.genres || []).map((g: any) => g.name),
        posterUrl: data.poster_path ? `${POSTER_SIZE.LARGE}${data.poster_path}` : undefined,
        backdropUrl: data.backdrop_path ? `${BACKDROP_SIZE.LARGE}${data.backdrop_path}` : undefined,
        cast,
        directors,
        trailers,
        officialTrailerUrl: officialTrailer?.url,
        watchLinks,
        imdbId: data.imdb_id,
        tmdbId: data.id,
        homepage: data.homepage,
        isAdult: data.adult,
      };
    } catch (err: any) {
      logger.error({ err: err.message, id }, 'TMDB getMovie error');
      return null;
    }
  }

  /**
   * Get watch links directly
   */
  public async getWatchLinks(movieId: string, region = env.TMDB_DEFAULT_REGION): Promise<WatchLink[]> {
    const movie = await this.getMovie(movieId, region);
    return movie ? movie.watchLinks : [];
  }

  /**
   * Discover movies by genre ID, year, director, or actor
   */
  public async discover(params: Record<string, any>): Promise<MovieSearchResult[]> {
    try {
      const response = await this.client.get('/discover/movie', {
        params: {
          include_adult: false,
          language: 'id-ID',
          sort_by: 'popularity.desc',
          ...params,
        },
      });

      const results = response.data.results || [];
      return results.slice(0, 10).map((item: any) => ({
        id: String(item.id),
        title: item.title,
        year: extractYear(item.release_date),
        rating: item.vote_average || 0,
        posterUrl: item.poster_path ? `${POSTER_SIZE.MEDIUM}${item.poster_path}` : undefined,
        overview: item.overview || '',
      }));
    } catch (err: any) {
      logger.error({ err: err.message, params }, 'TMDB discover error');
      return [];
    }
  }

  /**
   * Get trending movies
   */
  public async getTrending(timeWindow: 'day' | 'week' = 'day'): Promise<MovieSearchResult[]> {
    try {
      const response = await this.client.get(`/trending/movie/${timeWindow}`, {
        params: { language: 'id-ID' },
      });
      const results = response.data.results || [];
      return results.slice(0, 10).map((item: any) => ({
        id: String(item.id),
        title: item.title,
        year: extractYear(item.release_date),
        rating: item.vote_average || 0,
        posterUrl: item.poster_path ? `${POSTER_SIZE.MEDIUM}${item.poster_path}` : undefined,
        overview: item.overview || '',
      }));
    } catch (err: any) {
      logger.error({ err: err.message }, 'TMDB getTrending error');
      return [];
    }
  }

  /**
   * Get top rated movies
   */
  public async getTopRated(): Promise<MovieSearchResult[]> {
    try {
      const response = await this.client.get('/movie/top_rated', {
        params: { page: 1, language: 'id-ID' },
      });
      const results = response.data.results || [];
      return results.slice(0, 10).map((item: any) => ({
        id: String(item.id),
        title: item.title,
        year: extractYear(item.release_date),
        rating: item.vote_average || 0,
        posterUrl: item.poster_path ? `${POSTER_SIZE.MEDIUM}${item.poster_path}` : undefined,
        overview: item.overview || '',
      }));
    } catch (err: any) {
      logger.error({ err: err.message }, 'TMDB getTopRated error');
      return [];
    }
  }

  /**
   * Get movie recommendations for a movie ID
   */
  public async getRecommendations(movieId: string): Promise<MovieSearchResult[]> {
    try {
      const response = await this.client.get(`/movie/${movieId}/recommendations`, {
        params: { language: 'id-ID' },
      });
      const results = response.data.results || [];
      return results.slice(0, 10).map((item: any) => ({
        id: String(item.id),
        title: item.title,
        year: extractYear(item.release_date),
        rating: item.vote_average || 0,
        posterUrl: item.poster_path ? `${POSTER_SIZE.MEDIUM}${item.poster_path}` : undefined,
        overview: item.overview || '',
      }));
    } catch (err: any) {
      logger.error({ err: err.message, movieId }, 'TMDB getRecommendations error');
      return [];
    }
  }

  /**
   * Search for a person (Actor or Director)
   */
  public async searchPerson(name: string): Promise<{ id: number; name: string; knownForDepartment: string } | null> {
    try {
      const response = await this.client.get('/search/person', {
        params: { query: name },
      });
      const first = response.data.results?.[0];
      if (!first) return null;
      return {
        id: first.id,
        name: first.name,
        knownForDepartment: first.known_for_department,
      };
    } catch (err: any) {
      logger.error({ err: err.message, name }, 'TMDB searchPerson error');
      return null;
    }
  }
}

export const tmdbProvider = new TmdbProvider();

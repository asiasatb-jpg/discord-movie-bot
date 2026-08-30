import { Movie, MovieSearchResult, WatchLink } from '../types/movie.types.js';

export interface MovieProvider {
  name: string;
  search(query: string, limit?: number): Promise<MovieSearchResult[]>;
  getMovie(id: string, region?: string): Promise<Movie | null>;
  getWatchLinks(movieId: string, region?: string): Promise<WatchLink[]>;
}

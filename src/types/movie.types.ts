export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
}

export interface WatchProviderItem {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority?: number;
}

export interface WatchProviderCountry {
  link?: string;
  flatrate?: WatchProviderItem[];
  buy?: WatchProviderItem[];
  rent?: WatchProviderItem[];
  ads?: WatchProviderItem[];
  free?: WatchProviderItem[];
}

export interface WatchLink {
  providerName: string;
  providerType: 'flatrate' | 'buy' | 'rent' | 'free' | 'official_site';
  url: string;
  logoUrl?: string;
}

export interface VideoTrailer {
  id: string;
  name: string;
  key: string;
  site: 'YouTube' | string;
  type: 'Trailer' | 'Teaser' | 'Clip' | string;
  official: boolean;
  publishedAt?: string;
  url: string;
}

export interface Movie {
  id: string;
  provider: string; // e.g. 'tmdb'
  title: string;
  originalTitle?: string;
  tagline?: string;
  overview: string;
  releaseDate?: string;
  year?: number;
  runtime?: number; // minutes
  rating: number; // 0 - 10
  voteCount: number;
  genres: string[];
  posterUrl?: string;
  backdropUrl?: string;
  cast: CastMember[];
  directors: string[];
  trailers: VideoTrailer[];
  officialTrailerUrl?: string;
  watchLinks: WatchLink[];
  imdbId?: string;
  tmdbId?: number;
  homepage?: string;
  isAdult?: boolean;
}

export interface MovieSearchResult {
  id: string;
  title: string;
  year?: number;
  rating: number;
  posterUrl?: string;
  overview: string;
  genres?: string[];
}

export interface PlatformDetectionResult {
  isSupported: boolean;
  platformName?: string;
  platformDomain?: string;
  extractedId?: string;
  normalizedUrl?: string;
  searchQueryHint?: string;
}

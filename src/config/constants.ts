export const BOT_COLORS = {
  PRIMARY: 0x5865F2,    // Discord Blurple
  SUCCESS: 0x57F287,    // Green
  WARNING: 0xFEE75C,    // Yellow
  DANGER: 0xED4245,     // Red
  INFO: 0x3498DB,       // Blue
  DARK: 0x2B2D31,       // Dark Charcoal
  GOLD: 0xF1C40F,       // Gold for top rated
} as const;

export const EMOJIS = {
  MOVIE: '🎬',
  RATING: '⭐',
  RELEASE: '📅',
  GENRE: '🎭',
  DURATION: '⏱',
  TRAILER: '🎞',
  WATCH: '▶️',
  FAVORITE: '❤️',
  WATCHLIST: '📚',
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  LOADING: '⏳',
  SEARCH: '🔍',
  STATS: '📊',
  PING: '🏓',
  LOCK: '🔒',
  SPARKLES: '✨',
  DISCUSS: '💬',
} as const;

export const CACHE_TTL = {
  MOVIE_DETAILS: 3600,       // 1 hour
  SEARCH_RESULTS: 600,       // 10 minutes
  AUTOCOMPLETE: 300,         // 5 minutes
  STREAMING_PROVIDERS: 1800, // 30 minutes
  TRENDING: 1800,            // 30 minutes
  RATE_LIMIT: 60,            // 1 minute
} as const;

export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
export const POSTER_SIZE = {
  SMALL: `${TMDB_IMAGE_BASE_URL}/w185`,
  MEDIUM: `${TMDB_IMAGE_BASE_URL}/w342`,
  LARGE: `${TMDB_IMAGE_BASE_URL}/w500`,
  ORIGINAL: `${TMDB_IMAGE_BASE_URL}/original`,
} as const;

export const BACKDROP_SIZE = {
  MEDIUM: `${TMDB_IMAGE_BASE_URL}/w780`,
  LARGE: `${TMDB_IMAGE_BASE_URL}/w1280`,
  ORIGINAL: `${TMDB_IMAGE_BASE_URL}/original`,
} as const;

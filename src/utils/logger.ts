import pino from 'pino';
import { env } from '../config/env.config.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'DISCORD_TOKEN',
      'TMDB_API_KEY',
      'DATABASE_URL',
      'REDIS_URL',
      '*.token',
      '*.password',
      '*.apiKey',
      '*.api_key',
    ],
    censor: '[REDACTED]',
  },
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});

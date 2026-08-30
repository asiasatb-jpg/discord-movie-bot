import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const isTest = process.env.NODE_ENV === 'test' || typeof (globalThis as any).it === 'function';

const envSchema = z.object({
  DISCORD_TOKEN: isTest
    ? z.string().default('test_discord_token')
    : z.string().min(1, 'DISCORD_TOKEN is required'),
  DISCORD_CLIENT_ID: isTest
    ? z.string().default('123456789012345678')
    : z.string().min(1, 'DISCORD_CLIENT_ID is required'),
  DISCORD_GUILD_ID: z.string().optional(),
  ADMIN_USER_IDS: z.string().optional().default(''),
  TMDB_API_KEY: z.string().default(''),
  TMDB_DEFAULT_REGION: z.string().default('ID'),
  DATABASE_URL: isTest
    ? z.string().default('postgresql://postgres:postgres@localhost:5432/test?schema=public')
    : z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default(isTest ? 'test' : 'development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  ALLOWED_CHANNEL_IDS: z.string().optional().default(''),
  ALLOWED_CHANNEL_NAMES: z.string().optional().default(''),
  DEFAULT_LOCALE: z.string().default('id'),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(10),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  throw new Error('Environment validation failed');
}

export const env = {
  ...parsedEnv.data,
  adminUserIds: parsedEnv.data.ADMIN_USER_IDS
    ? parsedEnv.data.ADMIN_USER_IDS.split(',').map((id) => id.trim()).filter(Boolean)
    : [],
  allowedChannelIds: parsedEnv.data.ALLOWED_CHANNEL_IDS
    ? parsedEnv.data.ALLOWED_CHANNEL_IDS.split(',').map((id) => id.trim()).filter(Boolean)
    : [],
  allowedChannelNames: parsedEnv.data.ALLOWED_CHANNEL_NAMES
    ? parsedEnv.data.ALLOWED_CHANNEL_NAMES.split(',').map((name) => name.trim().toLowerCase()).filter(Boolean)
    : [],
};

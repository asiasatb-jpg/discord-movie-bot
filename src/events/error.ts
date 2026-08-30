import { logger } from '../utils/logger.js';

export function handleError(error: Error): void {
  logger.error({ err: error.message, stack: error.stack }, 'Global Discord client error');
}

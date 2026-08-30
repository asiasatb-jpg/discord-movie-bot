import { prisma } from '../database/prisma.js';
import { logger } from '../utils/logger.js';

export class UserService {
  /**
   * Ensures a user record exists in the database
   */
  public async ensureUser(userId: string, username: string, locale = 'id'): Promise<void> {
    try {
      await prisma.user.upsert({
        where: { id: userId },
        update: { username },
        create: {
          id: userId,
          username,
          locale,
        },
      });
    } catch (err: any) {
      logger.error({ err: err.message, userId }, 'Error ensuring user in database');
    }
  }

  /**
   * Add a movie to favorites
   */
  public async addFavorite(
    userId: string,
    movie: { id: string; title: string; posterPath?: string; year?: number; rating?: number },
    username = 'Unknown'
  ): Promise<'added' | 'already_exists' | 'error'> {
    try {
      await this.ensureUser(userId, username);

      const existing = await prisma.favorite.findUnique({
        where: {
          userId_movieId: {
            userId,
            movieId: movie.id,
          },
        },
      });

      if (existing) {
        return 'already_exists';
      }

      await prisma.favorite.create({
        data: {
          userId,
          movieId: movie.id,
          title: movie.title,
          posterPath: movie.posterPath,
          year: movie.year,
          rating: movie.rating,
        },
      });

      return 'added';
    } catch (err: any) {
      logger.error({ err: err.message, userId, movieId: movie.id }, 'Error adding favorite');
      return 'error';
    }
  }

  /**
   * Remove a movie from favorites
   */
  public async removeFavorite(userId: string, movieIdOrTitle: string): Promise<boolean> {
    try {
      // Check if match by movieId
      const byId = await prisma.favorite.findFirst({
        where: {
          userId,
          movieId: movieIdOrTitle,
        },
      });

      if (byId) {
        await prisma.favorite.delete({ where: { id: byId.id } });
        return true;
      }

      // Check if match by Title (case-insensitive)
      const byTitle = await prisma.favorite.findFirst({
        where: {
          userId,
          title: { contains: movieIdOrTitle, mode: 'insensitive' },
        },
      });

      if (byTitle) {
        await prisma.favorite.delete({ where: { id: byTitle.id } });
        return true;
      }

      return false;
    } catch (err: any) {
      logger.error({ err: err.message, userId }, 'Error removing favorite');
      return false;
    }
  }

  /**
   * Get user favorites
   */
  public async getFavorites(userId: string) {
    try {
      return await prisma.favorite.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err: any) {
      logger.error({ err: err.message, userId }, 'Error getting favorites');
      return [];
    }
  }

  /**
   * Add a movie to watchlist
   */
  public async addWatchlist(
    userId: string,
    movie: { id: string; title: string; posterPath?: string; year?: number; rating?: number },
    username = 'Unknown'
  ): Promise<'added' | 'already_exists' | 'error'> {
    try {
      await this.ensureUser(userId, username);

      const existing = await prisma.watchlist.findUnique({
        where: {
          userId_movieId: {
            userId,
            movieId: movie.id,
          },
        },
      });

      if (existing) {
        return 'already_exists';
      }

      await prisma.watchlist.create({
        data: {
          userId,
          movieId: movie.id,
          title: movie.title,
          posterPath: movie.posterPath,
          year: movie.year,
          rating: movie.rating,
        },
      });

      return 'added';
    } catch (err: any) {
      logger.error({ err: err.message, userId, movieId: movie.id }, 'Error adding to watchlist');
      return 'error';
    }
  }

  /**
   * Remove a movie from watchlist
   */
  public async removeWatchlist(userId: string, movieIdOrTitle: string): Promise<boolean> {
    try {
      const byId = await prisma.watchlist.findFirst({
        where: {
          userId,
          movieId: movieIdOrTitle,
        },
      });

      if (byId) {
        await prisma.watchlist.delete({ where: { id: byId.id } });
        return true;
      }

      const byTitle = await prisma.watchlist.findFirst({
        where: {
          userId,
          title: { contains: movieIdOrTitle, mode: 'insensitive' },
        },
      });

      if (byTitle) {
        await prisma.watchlist.delete({ where: { id: byTitle.id } });
        return true;
      }

      return false;
    } catch (err: any) {
      logger.error({ err: err.message, userId }, 'Error removing from watchlist');
      return false;
    }
  }

  /**
   * Get user watchlist
   */
  public async getWatchlist(userId: string) {
    try {
      return await prisma.watchlist.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err: any) {
      logger.error({ err: err.message, userId }, 'Error getting watchlist');
      return [];
    }
  }

  /**
   * Save search query to history
   */
  public async addSearchHistory(userId: string, query: string, username = 'Unknown'): Promise<void> {
    try {
      await this.ensureUser(userId, username);
      await prisma.searchHistory.create({
        data: {
          userId,
          query: query.trim(),
        },
      });
    } catch (err: any) {
      logger.debug({ err: err.message, userId }, 'Error adding search history');
    }
  }

  /**
   * Get user recent search history
   */
  public async getSearchHistory(userId: string, limit = 10) {
    try {
      return await prisma.searchHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (err: any) {
      logger.error({ err: err.message, userId }, 'Error getting search history');
      return [];
    }
  }

  /**
   * Clear user search history
   */
  public async clearSearchHistory(userId: string): Promise<boolean> {
    try {
      await prisma.searchHistory.deleteMany({
        where: { userId },
      });
      return true;
    } catch (err: any) {
      logger.error({ err: err.message, userId }, 'Error clearing search history');
      return false;
    }
  }
}

export const userService = new UserService();

import { ButtonInteraction } from 'discord.js';
import { movieService } from '../services/movie.service.js';
import { userService } from '../services/user.service.js';
import { i18n } from '../locales/i18n.js';
import { logger } from '../utils/logger.js';

export async function handleWatchlistButton(interaction: ButtonInteraction): Promise<void> {
  const movieId = interaction.customId.replace('wl_add_', '');
  const userId = interaction.user.id;
  const username = interaction.user.username;

  try {
    const movie = await movieService.getMovieDetails(movieId);
    if (!movie) {
      await interaction.reply({
        content: i18n.t('errors.movie_not_found'),
        ephemeral: true,
      });
      return;
    }

    const result = await userService.addWatchlist(
      userId,
      {
        id: movie.id,
        title: movie.title,
        posterPath: movie.posterUrl,
        year: movie.year,
        rating: movie.rating,
      },
      username
    );

    if (result === 'added') {
      await interaction.reply({
        content: i18n.t('watchlist.added', { title: movie.title }),
        ephemeral: true,
      });
    } else if (result === 'already_exists') {
      await interaction.reply({
        content: i18n.t('watchlist.already_exists', { title: movie.title }),
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: i18n.t('errors.generic_error'),
        ephemeral: true,
      });
    }
  } catch (err: any) {
    logger.error({ err: err.message, movieId, userId }, 'Error handling watchlist button');
    await interaction.reply({
      content: i18n.t('errors.generic_error'),
      ephemeral: true,
    });
  }
}

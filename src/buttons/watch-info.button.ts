import { ButtonInteraction } from 'discord.js';
import { movieService } from '../services/movie.service.js';
import { EmbedHelper } from '../utils/embed.builder.js';
import { ButtonHelper } from '../utils/button.builder.js';
import { i18n } from '../locales/i18n.js';
import { logger } from '../utils/logger.js';

export async function handleWatchInfoButton(interaction: ButtonInteraction): Promise<void> {
  const movieId = interaction.customId.replace('watch_info_', '');

  try {
    const movie = await movieService.getMovieDetails(movieId);
    if (!movie) {
      await interaction.reply({
        content: i18n.t('errors.movie_not_found'),
        ephemeral: true,
      });
      return;
    }

    const embed = EmbedHelper.whereToWatchEmbed(movie, movie.watchLinks);
    const linkRows = ButtonHelper.watchLinksRows(movie.watchLinks);

    await interaction.reply({
      embeds: [embed],
      components: linkRows,
      ephemeral: true,
    });
  } catch (err: any) {
    logger.error({ err: err.message, movieId }, 'Error handling watch info button');
    await interaction.reply({
      content: i18n.t('errors.generic_error'),
      ephemeral: true,
    });
  }
}

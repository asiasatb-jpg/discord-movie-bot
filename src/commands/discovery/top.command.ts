import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { SlashCommand } from '../../types/command.types.js';
import { movieService } from '../../services/movie.service.js';
import { sendPaginatedEmbed } from '../../utils/pagination.js';
import { i18n } from '../../locales/i18n.js';
import { logger } from '../../utils/logger.js';
import { EMOJIS } from '../../config/constants.js';

export const topCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('top')
    .setDescription('Tampilkan daftar film dengan rating tertinggi sepanjang masa'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      const topMovies = await movieService.getTopRated();

      if (topMovies.length === 0) {
        await interaction.editReply({
          content: 'Tidak dapat memuat film top rated saat ini.',
        });
        return;
      }

      const entries = topMovies.map((item) => {
        const rating = item.rating ? `⭐ ${item.rating.toFixed(1)}` : '';
        const year = item.year ? `(${item.year})` : '';
        return {
          title: `${item.title} ${year}`,
          description: `${rating}\n${item.overview.slice(0, 120)}...`,
          thumbnailUrl: item.posterUrl,
        };
      });

      await sendPaginatedEmbed(
        interaction,
        `${EMOJIS.RATING} Top Rated Movies Sepanjang Masa`,
        entries,
        5
      );
    } catch (err: any) {
      logger.error({ err: err.message }, 'Error in /top command');
      await interaction.editReply({
        content: i18n.t('errors.generic_error'),
      });
    }
  },
};

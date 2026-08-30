import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { SlashCommand } from '../../types/command.types.js';
import { movieService } from '../../services/movie.service.js';
import { sendPaginatedEmbed } from '../../utils/pagination.js';
import { i18n } from '../../locales/i18n.js';
import { logger } from '../../utils/logger.js';
import { EMOJIS } from '../../config/constants.js';

export const yearCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('year')
    .setDescription('Cari film populer berdasarkan tahun rilis')
    .addIntegerOption((option) =>
      option
        .setName('year')
        .setDescription('Tahun rilis film (misal: 2014, 1999)')
        .setRequired(true)
        .setMinValue(1900)
        .setMaxValue(2035)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const year = interaction.options.getInteger('year', true);

    try {
      const results = await movieService.discoverByYear(year);

      if (results.length === 0) {
        await interaction.editReply({
          content: `Tidak ditemukan film populer untuk tahun **${year}**.`,
        });
        return;
      }

      const entries = results.map((item) => {
        const rating = item.rating ? `⭐ ${item.rating.toFixed(1)}` : '';
        return {
          title: `${item.title} (${year})`,
          description: `${rating}\n${item.overview.slice(0, 120)}...`,
          thumbnailUrl: item.posterUrl,
        };
      });

      await sendPaginatedEmbed(
        interaction,
        `${EMOJIS.RELEASE} Film Populer Tahun ${year}`,
        entries,
        5
      );
    } catch (err: any) {
      logger.error({ err: err.message, year }, 'Error in /year command');
      await interaction.editReply({
        content: i18n.t('errors.generic_error'),
      });
    }
  },
};

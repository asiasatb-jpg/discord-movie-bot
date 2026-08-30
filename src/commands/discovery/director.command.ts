import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { SlashCommand } from '../../types/command.types.js';
import { movieService } from '../../services/movie.service.js';
import { sendPaginatedEmbed } from '../../utils/pagination.js';
import { i18n } from '../../locales/i18n.js';
import { logger } from '../../utils/logger.js';
import { EMOJIS } from '../../config/constants.js';

export const directorCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('director')
    .setDescription('Cari film yang disutradarai oleh sutradara tertentu')
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription('Nama sutradara (misal: Christopher Nolan, Quentin Tarantino)')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const directorName = interaction.options.getString('name', true);

    try {
      const data = await movieService.discoverByDirector(directorName);

      if (!data || data.movies.length === 0) {
        await interaction.editReply({
          content: `Tidak dapat menemukan film untuk sutradara: **${directorName}**.`,
        });
        return;
      }

      const entries = data.movies.map((item) => {
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
        `🎬 Film Karya Sutradara: ${data.directorName}`,
        entries,
        5
      );
    } catch (err: any) {
      logger.error({ err: err.message, directorName }, 'Error in /director command');
      await interaction.editReply({
        content: i18n.t('errors.generic_error'),
      });
    }
  },
};

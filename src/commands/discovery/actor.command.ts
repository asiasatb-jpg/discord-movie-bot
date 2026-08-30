import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { SlashCommand } from '../../types/command.types.js';
import { movieService } from '../../services/movie.service.js';
import { sendPaginatedEmbed } from '../../utils/pagination.js';
import { i18n } from '../../locales/i18n.js';
import { logger } from '../../utils/logger.js';
import { EMOJIS } from '../../config/constants.js';

export const actorCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('actor')
    .setDescription('Cari film yang dibintangi oleh aktor/aktris tertentu')
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription('Nama aktor/aktris (misal: Matthew McConaughey, Tom Cruise)')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const actorName = interaction.options.getString('name', true);

    try {
      const data = await movieService.discoverByActor(actorName);

      if (!data || data.movies.length === 0) {
        await interaction.editReply({
          content: `Tidak dapat menemukan film untuk aktor: **${actorName}**.`,
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
        `${EMOJIS.MOVIE} Film yang Dibintangi: ${data.actorName}`,
        entries,
        5
      );
    } catch (err: any) {
      logger.error({ err: err.message, actorName }, 'Error in /actor command');
      await interaction.editReply({
        content: i18n.t('errors.generic_error'),
      });
    }
  },
};

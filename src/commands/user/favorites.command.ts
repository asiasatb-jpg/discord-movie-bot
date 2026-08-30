import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { SlashCommand } from '../../types/command.types.js';
import { userService } from '../../services/user.service.js';
import { sendPaginatedEmbed } from '../../utils/pagination.js';
import { i18n } from '../../locales/i18n.js';
import { logger } from '../../utils/logger.js';
import { EMOJIS } from '../../config/constants.js';

export const favoritesCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('favorites')
    .setDescription('Tampilkan seluruh daftar film favorit kamu'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const userId = interaction.user.id;

    try {
      const favorites = await userService.getFavorites(userId);

      if (favorites.length === 0) {
        await interaction.editReply({
          content: i18n.t('favorite.empty'),
        });
        return;
      }

      const entries = favorites.map((fav) => {
        const rating = fav.rating ? `⭐ ${fav.rating.toFixed(1)}` : '';
        const year = fav.year ? `(${fav.year})` : '';
        return {
          title: `${fav.title} ${year}`,
          description: `${rating} • Ditambahkan: ${new Date(fav.createdAt).toLocaleDateString()}`,
          thumbnailUrl: fav.posterPath || undefined,
        };
      });

      await sendPaginatedEmbed(
        interaction,
        `${EMOJIS.FAVORITE} ${i18n.t('favorite.list_title')}`,
        entries,
        5
      );
    } catch (err: any) {
      logger.error({ err: err.message, userId }, 'Error in /favorites command');
      await interaction.editReply({
        content: i18n.t('errors.generic_error'),
      });
    }
  },
};

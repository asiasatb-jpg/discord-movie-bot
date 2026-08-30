import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { SlashCommand } from '../../types/command.types.js';
import { movieService } from '../../services/movie.service.js';
import { EmbedHelper } from '../../utils/embed.builder.js';
import { ButtonHelper } from '../../utils/button.builder.js';
import { i18n } from '../../locales/i18n.js';
import { logger } from '../../utils/logger.js';

export const randomCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('random')
    .setDescription('Dapatkan rekomendasi film acak yang populer dan berating bagus'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      const movie = await movieService.getRandomMovie();
      if (!movie) {
        await interaction.editReply({
          embeds: [EmbedHelper.error('Error', 'Gagal memuat rekomendasi film acak.')],
        });
        return;
      }

      const embed = EmbedHelper.movieDetailEmbed(movie);
      const actionRow = ButtonHelper.movieActionRow(movie);

      await interaction.editReply({
        embeds: [embed],
        components: [actionRow],
      });
    } catch (err: any) {
      logger.error({ err: err.message }, 'Error in /random command');
      await interaction.editReply({
        embeds: [EmbedHelper.error('Error', i18n.t('errors.generic_error'))],
      });
    }
  },
};

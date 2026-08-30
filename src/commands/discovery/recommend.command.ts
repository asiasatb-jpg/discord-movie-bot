import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
} from 'discord.js';
import { SlashCommand } from '../../types/command.types.js';
import { movieService } from '../../services/movie.service.js';
import { sendPaginatedEmbed } from '../../utils/pagination.js';
import { i18n } from '../../locales/i18n.js';
import { logger } from '../../utils/logger.js';
import { EMOJIS } from '../../config/constants.js';

export const recommendCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('recommend')
    .setDescription('Dapatkan rekomendasi film yang mirip dengan film pilihanmu')
    .addStringOption((option) =>
      option
        .setName('title')
        .setDescription('Judul film acuan')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction: AutocompleteInteraction) {
    const focusedValue = interaction.options.getFocused();
    if (!focusedValue) {
      await interaction.respond([]);
      return;
    }
    const suggestions = await movieService.getAutocompleteSuggestions(focusedValue);
    await interaction.respond(suggestions.slice(0, 25));
  },

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const title = interaction.options.getString('title', true);

    try {
      const data = await movieService.getRecommendations(title);

      if (!data || data.recommendations.length === 0) {
        await interaction.editReply({
          content: `Tidak ditemukan rekomendasi untuk film: **${title}**.`,
        });
        return;
      }

      const entries = data.recommendations.map((item) => {
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
        `${EMOJIS.SPARKLES} Rekomendasi Film Mirip: "${data.baseMovie.title}"`,
        entries,
        5
      );
    } catch (err: any) {
      logger.error({ err: err.message, title }, 'Error in /recommend command');
      await interaction.editReply({
        content: i18n.t('errors.generic_error'),
      });
    }
  },
};

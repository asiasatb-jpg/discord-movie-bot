import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
} from 'discord.js';
import { SlashCommand } from '../../types/command.types.js';
import { movieService } from '../../services/movie.service.js';
import { EmbedHelper } from '../../utils/embed.builder.js';
import { ButtonHelper } from '../../utils/button.builder.js';
import { i18n } from '../../locales/i18n.js';
import { logger } from '../../utils/logger.js';

export const platformCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('platform')
    .setDescription('Cek ketersediaan platform streaming resmi untuk film')
    .addStringOption((option) =>
      option
        .setName('title')
        .setDescription('Judul film')
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
      const movie = await movieService.resolveMovie(title);
      if (!movie) {
        await interaction.editReply({
          embeds: [
            EmbedHelper.error(
              'Film Tidak Ditemukan',
              i18n.t('errors.movie_not_found_query', { query: title })
            ),
          ],
        });
        return;
      }

      const embed = EmbedHelper.whereToWatchEmbed(movie, movie.watchLinks);
      const linkRows = ButtonHelper.watchLinksRows(movie.watchLinks);

      await interaction.editReply({
        embeds: [embed],
        components: linkRows,
      });
    } catch (err: any) {
      logger.error({ err: err.message, title }, 'Error in /platform command');
      await interaction.editReply({
        embeds: [EmbedHelper.error('Error', i18n.t('errors.generic_error'))],
      });
    }
  },
};

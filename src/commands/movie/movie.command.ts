import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
} from 'discord.js';
import { SlashCommand } from '../../types/command.types.js';
import { movieService } from '../../services/movie.service.js';
import { userService } from '../../services/user.service.js';
import { statsService } from '../../services/stats.service.js';
import { EmbedHelper } from '../../utils/embed.builder.js';
import { ButtonHelper } from '../../utils/button.builder.js';
import { i18n } from '../../locales/i18n.js';
import { logger } from '../../utils/logger.js';

export const movieCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('movie')
    .setDescription('Cari film dan tampilkan informasi lengkap serta platform streaming resmi')
    .addStringOption((option) =>
      option
        .setName('title')
        .setDescription('Judul film yang ingin dicari')
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
    const query = interaction.options.getString('title', true);

    try {
      statsService.recordSearch();
      const movie = await movieService.resolveMovie(query);

      if (!movie) {
        await interaction.editReply({
          embeds: [
            EmbedHelper.error(
              'Film Tidak Ditemukan',
              i18n.t('errors.movie_not_found_query', { query })
            ),
          ],
        });
        return;
      }

      // Save search to history asynchronously
      userService.addSearchHistory(interaction.user.id, movie.title, interaction.user.username);

      const embed = EmbedHelper.movieDetailEmbed(movie);
      const actionRow = ButtonHelper.movieActionRow(movie);

      await interaction.editReply({
        embeds: [embed],
        components: [actionRow],
      });
    } catch (err: any) {
      logger.error({ err: err.message, query }, 'Error in /movie command');
      await interaction.editReply({
        embeds: [EmbedHelper.error('Error', i18n.t('errors.generic_error'))],
      });
    }
  },
};

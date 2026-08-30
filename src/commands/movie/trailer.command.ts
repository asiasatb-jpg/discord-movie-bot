import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { SlashCommand } from '../../types/command.types.js';
import { movieService } from '../../services/movie.service.js';
import { youtubeProvider } from '../../providers/youtube.provider.js';
import { EmbedHelper } from '../../utils/embed.builder.js';
import { i18n } from '../../locales/i18n.js';
import { logger } from '../../utils/logger.js';
import { BOT_COLORS, EMOJIS } from '../../config/constants.js';

export const trailerCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('trailer')
    .setDescription('Tonton official trailer film di YouTube')
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

      const trailerUrl =
        movie.officialTrailerUrl ||
        (movie.trailers.length > 0 ? movie.trailers[0].url : null) ||
        youtubeProvider.getSearchTrailerUrl(movie.title, movie.year);

      const embed = new EmbedBuilder()
        .setColor(BOT_COLORS.PRIMARY)
        .setTitle(`${EMOJIS.TRAILER} Official Trailer: ${movie.title} ${movie.year ? `(${movie.year})` : ''}`)
        .setDescription(
          `Trailer resmi film **${movie.title}** tersedia di YouTube.\n\nKlik tombol di bawah untuk langsung memutar trailer di YouTube.`
        );

      if (movie.backdropUrl) {
        embed.setImage(movie.backdropUrl);
      } else if (movie.posterUrl) {
        embed.setThumbnail(movie.posterUrl);
      }

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('▶ Buka Trailer di YouTube')
          .setStyle(ButtonStyle.Link)
          .setURL(trailerUrl)
      );

      await interaction.editReply({
        embeds: [embed],
        components: [row],
      });
    } catch (err: any) {
      logger.error({ err: err.message, title }, 'Error in /trailer command');
      await interaction.editReply({
        embeds: [EmbedHelper.error('Error', i18n.t('errors.generic_error'))],
      });
    }
  },
};

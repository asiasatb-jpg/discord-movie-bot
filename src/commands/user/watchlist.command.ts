import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
} from 'discord.js';
import { SlashCommand } from '../../types/command.types.js';
import { movieService } from '../../services/movie.service.js';
import { userService } from '../../services/user.service.js';
import { sendPaginatedEmbed } from '../../utils/pagination.js';
import { EmbedHelper } from '../../utils/embed.builder.js';
import { i18n } from '../../locales/i18n.js';
import { logger } from '../../utils/logger.js';
import { EMOJIS } from '../../config/constants.js';

export const watchlistCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('watchlist')
    .setDescription('Kelola daftar tontonan (Watchlist) kamu')
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Tambahkan film ke Watchlist')
        .addStringOption((opt) =>
          opt
            .setName('title')
            .setDescription('Judul film')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('Hapus film dari Watchlist')
        .addStringOption((opt) =>
          opt
            .setName('title')
            .setDescription('Judul film')
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('list')
        .setDescription('Tampilkan daftar film di Watchlist kamu')
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
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const username = interaction.user.username;

    try {
      if (subcommand === 'list') {
        await interaction.deferReply();
        const watchlist = await userService.getWatchlist(userId);

        if (watchlist.length === 0) {
          await interaction.editReply({
            content: i18n.t('watchlist.empty'),
          });
          return;
        }

        const entries = watchlist.map((item) => {
          const rating = item.rating ? `⭐ ${item.rating.toFixed(1)}` : '';
          const year = item.year ? `(${item.year})` : '';
          return {
            title: `${item.title} ${year}`,
            description: `${rating} • Ditambahkan: ${new Date(item.createdAt).toLocaleDateString()}`,
            thumbnailUrl: item.posterPath || undefined,
          };
        });

        await sendPaginatedEmbed(
          interaction,
          `${EMOJIS.WATCHLIST} ${i18n.t('watchlist.list_title')}`,
          entries,
          5
        );
        return;
      }

      await interaction.deferReply({ ephemeral: true });
      const title = interaction.options.getString('title', true);

      if (subcommand === 'add') {
        const movie = await movieService.resolveMovie(title);
        if (!movie) {
          await interaction.editReply({
            embeds: [
              EmbedHelper.error('Film Tidak Ditemukan', i18n.t('errors.movie_not_found_query', { query: title })),
            ],
          });
          return;
        }

        const res = await userService.addWatchlist(
          userId,
          {
            id: movie.id,
            title: movie.title,
            posterPath: movie.posterUrl,
            year: movie.year,
            rating: movie.rating,
          },
          username
        );

        if (res === 'added') {
          await interaction.editReply({
            embeds: [EmbedHelper.success('Watchlist Ditambahkan', i18n.t('watchlist.added', { title: movie.title }))],
          });
        } else if (res === 'already_exists') {
          await interaction.editReply({
            embeds: [EmbedHelper.info('Sudah Ada', i18n.t('watchlist.already_exists', { title: movie.title }))],
          });
        } else {
          await interaction.editReply({
            embeds: [EmbedHelper.error('Error', i18n.t('errors.generic_error'))],
          });
        }
      } else if (subcommand === 'remove') {
        const removed = await userService.removeWatchlist(userId, title);
        if (removed) {
          await interaction.editReply({
            embeds: [EmbedHelper.success('Watchlist Dihapus', i18n.t('watchlist.removed', { title }))],
          });
        } else {
          await interaction.editReply({
            embeds: [EmbedHelper.error('Tidak Ditemukan', `Film **${title}** tidak ditemukan di Watchlist kamu.`)],
          });
        }
      }
    } catch (err: any) {
      logger.error({ err: err.message, userId, subcommand }, 'Error in /watchlist command');
      await interaction.editReply({
        embeds: [EmbedHelper.error('Error', i18n.t('errors.generic_error'))],
      });
    }
  },
};

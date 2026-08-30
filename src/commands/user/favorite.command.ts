import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
} from 'discord.js';
import { SlashCommand } from '../../types/command.types.js';
import { movieService } from '../../services/movie.service.js';
import { userService } from '../../services/user.service.js';
import { EmbedHelper } from '../../utils/embed.builder.js';
import { i18n } from '../../locales/i18n.js';
import { logger } from '../../utils/logger.js';

export const favoriteCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('favorite')
    .setDescription('Kelola daftar film favorit kamu')
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Tambahkan film ke daftar favorit')
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
        .setDescription('Hapus film dari daftar favorit')
        .addStringOption((opt) =>
          opt
            .setName('title')
            .setDescription('Judul film')
            .setRequired(true)
        )
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
    await interaction.deferReply({ ephemeral: true });
    const subcommand = interaction.options.getSubcommand();
    const title = interaction.options.getString('title', true);
    const userId = interaction.user.id;
    const username = interaction.user.username;

    try {
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

        const res = await userService.addFavorite(
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
            embeds: [EmbedHelper.success('Favorit Ditambahkan', i18n.t('favorite.added', { title: movie.title }))],
          });
        } else if (res === 'already_exists') {
          await interaction.editReply({
            embeds: [EmbedHelper.info('Sudah Ada', i18n.t('favorite.already_exists', { title: movie.title }))],
          });
        } else {
          await interaction.editReply({
            embeds: [EmbedHelper.error('Error', i18n.t('errors.generic_error'))],
          });
        }
      } else if (subcommand === 'remove') {
        const removed = await userService.removeFavorite(userId, title);
        if (removed) {
          await interaction.editReply({
            embeds: [EmbedHelper.success('Favorit Dihapus', i18n.t('favorite.removed', { title }))],
          });
        } else {
          await interaction.editReply({
            embeds: [EmbedHelper.error('Tidak Ditemukan', `Film **${title}** tidak ditemukan di daftar favorit kamu.`)],
          });
        }
      }
    } catch (err: any) {
      logger.error({ err: err.message, title, subcommand }, 'Error in /favorite command');
      await interaction.editReply({
        embeds: [EmbedHelper.error('Error', i18n.t('errors.generic_error'))],
      });
    }
  },
};

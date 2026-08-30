import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { SlashCommand } from '../../types/command.types.js';
import { movieService, GENRE_MAP } from '../../services/movie.service.js';
import { sendPaginatedEmbed } from '../../utils/pagination.js';
import { i18n } from '../../locales/i18n.js';
import { logger } from '../../utils/logger.js';
import { EMOJIS } from '../../config/constants.js';

export const genreCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('genre')
    .setDescription('Cari film populer berdasarkan genre')
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription('Pilih genre film')
        .setRequired(true)
        .addChoices(
          { name: 'Action', value: 'action' },
          { name: 'Adventure', value: 'adventure' },
          { name: 'Animation', value: 'animation' },
          { name: 'Comedy', value: 'comedy' },
          { name: 'Crime', value: 'crime' },
          { name: 'Documentary', value: 'documentary' },
          { name: 'Drama', value: 'drama' },
          { name: 'Family', value: 'family' },
          { name: 'Fantasy', value: 'fantasy' },
          { name: 'History', value: 'history' },
          { name: 'Horror', value: 'horror' },
          { name: 'Mystery', value: 'mystery' },
          { name: 'Romance', value: 'romance' },
          { name: 'Sci-Fi', value: 'sci-fi' },
          { name: 'Thriller', value: 'thriller' },
          { name: 'War', value: 'war' },
          { name: 'Western', value: 'western' }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const genre = interaction.options.getString('name', true);

    try {
      const results = await movieService.discoverByGenre(genre);

      if (results.length === 0) {
        await interaction.editReply({
          content: `Tidak ditemukan film untuk genre: **${genre}**.`,
        });
        return;
      }

      const entries = results.map((item) => {
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
        `${EMOJIS.GENRE} Film Populer Genre: ${genre.toUpperCase()}`,
        entries,
        5
      );
    } catch (err: any) {
      logger.error({ err: err.message, genre }, 'Error in /genre command');
      await interaction.editReply({
        content: i18n.t('errors.generic_error'),
      });
    }
  },
};

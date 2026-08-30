import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ComponentType,
} from 'discord.js';
import { SlashCommand } from '../../types/command.types.js';
import { movieService } from '../../services/movie.service.js';
import { userService } from '../../services/user.service.js';
import { statsService } from '../../services/stats.service.js';
import { EmbedHelper } from '../../utils/embed.builder.js';
import { ButtonHelper } from '../../utils/button.builder.js';
import { i18n } from '../../locales/i18n.js';
import { logger } from '../../utils/logger.js';

export const searchCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Cari daftar film berdasarkan nama (hingga 10 hasil)')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('Kata kunci pencarian film')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const query = interaction.options.getString('query', true);

    try {
      statsService.recordSearch();
      const results = await movieService.search(query, 5);

      if (results.length === 0) {
        await interaction.editReply({
          embeds: [
            EmbedHelper.error(
              'Tidak Ditemukan',
              i18n.t('errors.movie_not_found_query', { query })
            ),
          ],
        });
        return;
      }

      userService.addSearchHistory(interaction.user.id, query, interaction.user.username);

      const embed = EmbedHelper.searchResultsEmbed(query, results);
      const row = ButtonHelper.searchSelectionRow(results.length, 'sel_search_');

      const response = await interaction.editReply({
        embeds: [embed],
        components: [row],
      });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000,
      });

      collector.on('collect', async (btnInt) => {
        if (btnInt.user.id !== interaction.user.id) {
          await btnInt.reply({
            content: 'Hanya pengguna yang memanggil /search yang dapat memilih hasil.',
            ephemeral: true,
          });
          return;
        }

        const indexStr = btnInt.customId.replace('sel_search_', '');
        const index = parseInt(indexStr, 10);
        const selected = results[index];

        if (selected) {
          await btnInt.deferUpdate();
          const movie = await movieService.getMovieDetails(selected.id);
          if (movie) {
            const movieEmbed = EmbedHelper.movieDetailEmbed(movie);
            const actionRow = ButtonHelper.movieActionRow(movie);
            await interaction.editReply({
              embeds: [movieEmbed],
              components: [actionRow],
            });
          }
        }
      });
    } catch (err: any) {
      logger.error({ err: err.message, query }, 'Error in /search command');
      await interaction.editReply({
        embeds: [EmbedHelper.error('Error', i18n.t('errors.generic_error'))],
      });
    }
  },
};

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { SlashCommand } from '../../types/command.types.js';
import { movieService } from '../../services/movie.service.js';
import { providerManager } from '../../providers/provider-manager.js';
import { isSafeUrl } from '../../utils/ssrf.validator.js';
import { platformDetector } from '../../providers/platform-detector.js';
import { EmbedHelper } from '../../utils/embed.builder.js';
import { ButtonHelper } from '../../utils/button.builder.js';
import { i18n } from '../../locales/i18n.js';
import { logger } from '../../utils/logger.js';
import { EMOJIS, BOT_COLORS } from '../../config/constants.js';

export const watchCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('watch')
    .setDescription('Tonton film atau deteksi link streaming resmi (URL / Judul Film)')
    .addStringOption((option) =>
      option
        .setName('input')
        .setDescription('Judul film atau URL resmi (Netflix, Disney+, Prime, YouTube, dll.)')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const input = interaction.options.getString('input', true).trim();

    try {
      // Check if input is a URL
      const isUrlInput = input.startsWith('http://') || input.startsWith('https://');

      if (isUrlInput) {
        // 1. Validate URL against SSRF
        const safetyCheck = isSafeUrl(input);
        if (!safetyCheck.isValid) {
          await interaction.editReply({
            embeds: [EmbedHelper.error('URL Tidak Aman', i18n.t('errors.invalid_url'))],
          });
          return;
        }

        // 2. Detect Whitelisted Streaming Platform
        const detection = platformDetector.detect(input);
        if (!detection.isSupported) {
          await interaction.editReply({
            embeds: [
              EmbedHelper.error(
                'Platform Tidak Didukung',
                i18n.t('errors.unsupported_platform')
              ),
            ],
          });
          return;
        }

        // 3. Resolve metadata if possible
        const resolved = await providerManager.resolveUrl(input);
        const platformName = detection.platformName || 'Penyedia Resmi';

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel(`Open ${platformName}`)
            .setEmoji(EMOJIS.WATCH)
            .setStyle(ButtonStyle.Link)
            .setURL(detection.normalizedUrl || input)
        );

        if (resolved.movie) {
          const embed = EmbedHelper.movieDetailEmbed(resolved.movie);
          await interaction.editReply({
            embeds: [embed],
            components: [row],
          });
        } else {
          // Fallback embed when exact movie match isn't known from URL slug alone
          const embed = EmbedHelper.info(
            `Streaming Resmi: ${platformName}`,
            `Link resmi terverifikasi untuk platform **${platformName}**.\n\nKlik tombol di bawah untuk langsung membuka halaman tonton resmi di platform tersebut.`
          ).setColor(BOT_COLORS.SUCCESS);

          await interaction.editReply({
            embeds: [embed],
            components: [row],
          });
        }
        return;
      }

      // Input is a movie title / name
      const movie = await movieService.resolveMovie(input);
      if (!movie) {
        await interaction.editReply({
          embeds: [
            EmbedHelper.error(
              'Film Tidak Ditemukan',
              i18n.t('errors.movie_not_found_query', { query: input })
            ),
          ],
        });
        return;
      }

      const whereToWatchEmbed = EmbedHelper.whereToWatchEmbed(movie, movie.watchLinks);
      const linkRows = ButtonHelper.watchLinksRows(movie.watchLinks);

      await interaction.editReply({
        embeds: [whereToWatchEmbed],
        components: linkRows,
      });
    } catch (err: any) {
      logger.error({ err: err.message, input }, 'Error in /watch command');
      await interaction.editReply({
        embeds: [EmbedHelper.error('Error', i18n.t('errors.generic_error'))],
      });
    }
  },
};

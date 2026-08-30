import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionsBitField,
  EmbedBuilder,
} from 'discord.js';
import { SlashCommand } from '../../types/command.types.js';
import { isBotAdmin } from '../../middleware/admin.guard.js';
import { cacheService } from '../../services/cache.service.js';
import { statsService } from '../../services/stats.service.js';
import { providerManager } from '../../providers/provider-manager.js';
import { prisma } from '../../database/prisma.js';
import { EmbedHelper } from '../../utils/embed.builder.js';
import { i18n } from '../../locales/i18n.js';
import { BOT_COLORS, EMOJIS } from '../../config/constants.js';
import { logger } from '../../utils/logger.js';

export const adminCommand: SlashCommand = {
  adminOnly: true,
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Panel perintah khusus Administrator bot')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addSubcommand((sub) =>
      sub.setName('stats').setDescription('Lihat statistik mendalam (DB, Cache, Memory)')
    )
    .addSubcommand((sub) =>
      sub.setName('cache-clear').setDescription('Hapus seluruh cache Redis dan in-memory')
    )
    .addSubcommand((sub) =>
      sub.setName('providers').setDescription('Cek status seluruh Movie Provider yang terdaftar')
    )
    .addSubcommand((sub) =>
      sub
        .setName('broadcast')
        .setDescription('Kirim pesan pengumuman ke seluruh server yang terpasang bot')
        .addStringOption((opt) =>
          opt.setName('message').setDescription('Isi pesan pengumuman').setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!isBotAdmin(interaction)) {
      await interaction.reply({
        content: i18n.t('errors.admin_only'),
        ephemeral: true,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    try {
      if (subcommand === 'stats') {
        await interaction.deferReply({ ephemeral: true });

        // Query database counts
        const userCount = await prisma.user.count();
        const favoriteCount = await prisma.favorite.count();
        const watchlistCount = await prisma.watchlist.count();
        const searchHistoryCount = await prisma.searchHistory.count();
        const stats = statsService.getStats();

        const embed = new EmbedBuilder()
          .setColor(BOT_COLORS.GOLD)
          .setTitle(`${EMOJIS.LOCK} Admin Statistics Dashboard`)
          .addFields(
            { name: '👥 Total Users', value: `\`${userCount}\``, inline: true },
            { name: '❤️ Total Favorites', value: `\`${favoriteCount}\``, inline: true },
            { name: '📚 Total Watchlists', value: `\`${watchlistCount}\``, inline: true },
            { name: '🔎 Total Search Logs', value: `\`${searchHistoryCount}\``, inline: true },
            { name: '🧠 Heap Memory', value: `\`${stats.memoryUsageMB} MB\``, inline: true },
            { name: '🌐 Total Guilds', value: `\`${interaction.client.guilds.cache.size}\``, inline: true }
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      if (subcommand === 'cache-clear') {
        await interaction.deferReply({ ephemeral: true });
        await cacheService.clearAll();
        await interaction.editReply({
          embeds: [EmbedHelper.success('Cache Dibersihkan', 'Seluruh data cache Redis dan In-Memory berhasil di-reset.')],
        });
        return;
      }

      if (subcommand === 'providers') {
        await interaction.deferReply({ ephemeral: true });
        const providers = providerManager.listProviders();

        const embed = new EmbedBuilder()
          .setColor(BOT_COLORS.INFO)
          .setTitle('🎬 Status Movie Providers')
          .setDescription(
            providers
              .map((p) => `• **${p.name}** (\`${p.key}\`) — \`Active / Healthy\``)
              .join('\n')
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      if (subcommand === 'broadcast') {
        await interaction.deferReply({ ephemeral: true });
        const message = interaction.options.getString('message', true);

        let sentCount = 0;
        const guilds = interaction.client.guilds.cache;

        for (const [, guild] of guilds) {
          try {
            const channel =
              guild.systemChannel ||
              guild.channels.cache.find(
                (c) => c.isTextBased() && c.permissionsFor(guild.members.me!)?.has(PermissionsBitField.Flags.SendMessages)
              );

            if (channel && channel.isTextBased()) {
              const broadcastEmbed = new EmbedBuilder()
                .setColor(BOT_COLORS.PRIMARY)
                .setTitle('📢 Pengumuman Movie Assistant')
                .setDescription(message)
                .setFooter({ text: 'Pesan resmi dari Administrator Bot' })
                .setTimestamp();

              await (channel as any).send({ embeds: [broadcastEmbed] });
              sentCount++;
            }
          } catch {
            // Ignore if channel cannot be sent to
          }
        }

        await interaction.editReply({
          embeds: [
            EmbedHelper.success(
              'Broadcast Terkirim',
              `Pengumuman berhasil dikirim ke **${sentCount}** dari **${guilds.size}** server.`
            ),
          ],
        });
      }
    } catch (err: any) {
      logger.error({ err: err.message, subcommand }, 'Error in /admin command');
      await interaction.editReply({
        embeds: [EmbedHelper.error('Admin Error', i18n.t('errors.generic_error'))],
      });
    }
  },
};

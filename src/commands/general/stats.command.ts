import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { SlashCommand } from '../../types/command.types.js';
import { statsService } from '../../services/stats.service.js';
import { formatDuration } from '../../utils/formatters.js';
import { BOT_COLORS, EMOJIS } from '../../config/constants.js';

export const statsCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Tampilkan statistik penggunaan bot, uptime, dan performa memori'),

  async execute(interaction: ChatInputCommandInteraction) {
    const stats = statsService.getStats();

    const embed = new EmbedBuilder()
      .setColor(BOT_COLORS.PRIMARY)
      .setTitle(`${EMOJIS.STATS} Statistik Sistem Bot`)
      .addFields(
        { name: '⏱ Uptime', value: `\`${formatDuration(stats.uptimeSeconds)}\``, inline: true },
        { name: '🧠 Penggunaan Memori', value: `\`${stats.memoryUsageMB} MB\``, inline: true },
        { name: '🌐 Server Aktif', value: `\`${interaction.client.guilds.cache.size}\``, inline: true },
        { name: '⌨️ Total Perintah Dipanggil', value: `\`${stats.totalCommands}\``, inline: true },
        { name: '🔍 Total Pencarian Film', value: `\`${stats.totalSearches}\``, inline: true },
        { name: '🔘 Total Interaksi Tombol', value: `\`${stats.totalButtonClicks}\``, inline: true }
      )
      .setFooter({ text: `Node.js ${process.version} • discord.js v14` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
} from 'discord.js';
import { SlashCommand } from '../../types/command.types.js';
import { userService } from '../../services/user.service.js';
import { EmbedHelper } from '../../utils/embed.builder.js';
import { i18n } from '../../locales/i18n.js';
import { logger } from '../../utils/logger.js';
import { BOT_COLORS, EMOJIS } from '../../config/constants.js';

export const historyCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription('Tampilkan riwayat pencarian film kamu')
    .addSubcommand((sub) =>
      sub
        .setName('list')
        .setDescription('Tampilkan riwayat pencarian terakhir')
    )
    .addSubcommand((sub) =>
      sub
        .setName('clear')
        .setDescription('Hapus seluruh riwayat pencarian kamu')
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    try {
      if (subcommand === 'clear') {
        await interaction.deferReply({ ephemeral: true });
        await userService.clearSearchHistory(userId);
        await interaction.editReply({
          embeds: [EmbedHelper.success('Riwayat Dibersihkan', i18n.t('history.cleared'))],
        });
        return;
      }

      // Default: list
      await interaction.deferReply({ ephemeral: true });
      const history = await userService.getSearchHistory(userId, 10);

      if (history.length === 0) {
        await interaction.editReply({
          content: i18n.t('history.empty'),
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(BOT_COLORS.PRIMARY)
        .setTitle(`${EMOJIS.SEARCH} ${i18n.t('history.recent_title')}`)
        .setDescription(
          history
            .map((item, idx) => `**${idx + 1}.** \`${item.query}\` — *<t:${Math.floor(new Date(item.createdAt).getTime() / 1000)}:R>*`)
            .join('\n')
        )
        .setFooter({ text: 'Gunakan tombol di bawah jika ingin menghapus riwayat ini' });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('btn_clear_history')
          .setLabel('Hapus Semua Riwayat')
          .setEmoji('🗑️')
          .setStyle(ButtonStyle.Danger)
      );

      const response = await interaction.editReply({
        embeds: [embed],
        components: [row],
      });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000,
      });

      collector.on('collect', async (btnInt) => {
        if (btnInt.customId === 'btn_clear_history') {
          await userService.clearSearchHistory(userId);
          await btnInt.update({
            embeds: [EmbedHelper.success('Riwayat Dibersihkan', i18n.t('history.cleared'))],
            components: [],
          });
        }
      });
    } catch (err: any) {
      logger.error({ err: err.message, userId }, 'Error in /history command');
      await interaction.editReply({
        embeds: [EmbedHelper.error('Error', i18n.t('errors.generic_error'))],
      });
    }
  },
};

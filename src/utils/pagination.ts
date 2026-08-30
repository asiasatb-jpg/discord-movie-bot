import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
} from 'discord.js';
import { BOT_COLORS } from '../config/constants.js';

export interface PaginationEntry {
  title: string;
  description: string;
  thumbnailUrl?: string;
}

export async function sendPaginatedEmbed(
  interaction: ChatInputCommandInteraction,
  title: string,
  entries: PaginationEntry[],
  itemsPerPage = 5
): Promise<void> {
  if (entries.length === 0) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(BOT_COLORS.INFO)
          .setTitle(title)
          .setDescription('Tidak ada data untuk ditampilkan.'),
      ],
    });
    return;
  }

  const totalPages = Math.ceil(entries.length / itemsPerPage);
  let currentPage = 0;

  const buildEmbed = (page: number) => {
    const start = page * itemsPerPage;
    const currentItems = entries.slice(start, start + itemsPerPage);

    const embed = new EmbedBuilder()
      .setColor(BOT_COLORS.PRIMARY)
      .setTitle(title)
      .setDescription(
        currentItems
          .map((item, idx) => `**${start + idx + 1}.** **${item.title}**\n${item.description}`)
          .join('\n\n')
      )
      .setFooter({
        text: `Halaman ${page + 1} dari ${totalPages} • Total: ${entries.length} item`,
      });

    if (currentItems[0]?.thumbnailUrl) {
      embed.setThumbnail(currentItems[0].thumbnailUrl);
    }

    return embed;
  };

  const buildRow = (page: number) => {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('prev_page')
        .setLabel('◀ Previous')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page === 0),
      new ButtonBuilder()
        .setCustomId('next_page')
        .setLabel('Next ▶')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page === totalPages - 1)
    );
  };

  const reply = await interaction.editReply({
    embeds: [buildEmbed(currentPage)],
    components: totalPages > 1 ? [buildRow(currentPage)] : [],
  });

  if (totalPages <= 1) return;

  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 120000, // 2 minutes
  });

  collector.on('collect', async (btnInt) => {
    if (btnInt.user.id !== interaction.user.id) {
      await btnInt.reply({
        content: 'Hanya orang yang memanggil perintah ini yang dapat mengganti halaman.',
        ephemeral: true,
      });
      return;
    }

    if (btnInt.customId === 'prev_page' && currentPage > 0) {
      currentPage--;
    } else if (btnInt.customId === 'next_page' && currentPage < totalPages - 1) {
      currentPage++;
    }

    await btnInt.update({
      embeds: [buildEmbed(currentPage)],
      components: [buildRow(currentPage)],
    });
  });

  collector.on('end', async () => {
    try {
      await interaction.editReply({
        components: [],
      });
    } catch {
      // Ignored if message was deleted
    }
  });
}

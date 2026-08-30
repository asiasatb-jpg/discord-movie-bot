import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { SlashCommand } from '../../types/command.types.js';
import { BOT_COLORS, EMOJIS } from '../../config/constants.js';

export const pingCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Cek latensi bot dan koneksi WebSocket Discord'),

  async execute(interaction: ChatInputCommandInteraction) {
    const sent = await interaction.reply({
      content: `${EMOJIS.PING} Mengukur latensi...`,
      fetchReply: true,
    });

    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
    const wsPing = interaction.client.ws.ping;

    const embed = new EmbedBuilder()
      .setColor(BOT_COLORS.SUCCESS)
      .setTitle(`${EMOJIS.PING} Pong!`)
      .addFields(
        { name: '📡 Roundtrip Latency', value: `\`${roundtrip}ms\``, inline: true },
        { name: '💓 WebSocket Heartbeat', value: `\`${wsPing}ms\``, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ content: '', embeds: [embed] });
  },
};

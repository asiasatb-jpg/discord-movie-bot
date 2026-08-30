import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  InviteTargetType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  GuildMember,
} from 'discord.js';
import { SlashCommand } from '../../types/command.types.js';
import { movieService } from '../../services/movie.service.js';
import { EmbedHelper } from '../../utils/embed.builder.js';
import { BOT_COLORS, EMOJIS } from '../../config/constants.js';
import { logger } from '../../utils/logger.js';

// Official Discord Embedded App ID for "Watch Together" (YouTube)
const WATCH_TOGETHER_APP_ID = '880218394199220334';

export const streamCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('stream')
    .setDescription('Mulai sesi Nonton Bareng (Watch Together) langsung di dalam Voice Channel')
    .addStringOption((opt) =>
      opt
        .setName('title')
        .setDescription('Judul film atau trailer yang ingin ditonton (opsional)')
        .setRequired(false)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    if (!focusedValue) {
      await interaction.respond([]);
      return;
    }
    const suggestions = await movieService.getAutocompleteSuggestions(focusedValue);
    await interaction.respond(suggestions.slice(0, 25));
  },

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const member = interaction.member as GuildMember;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel) {
      await interaction.editReply({
        embeds: [
          EmbedHelper.error(
            'Harus Masuk Voice Channel',
            'Kamu harus bergabung ke dalam salah satu Voice Channel (misal: **Movie 1**) terlebih dahulu untuk memulai sesi streaming nonton bareng!'
          ),
        ],
      });
      return;
    }

    try {
      // Create Discord Watch Together Activity invite
      const invite = await (voiceChannel as any).createInvite({
        targetApplication: WATCH_TOGETHER_APP_ID,
        targetType: InviteTargetType.EmbeddedApplication,
        maxAge: 3600, // 1 hour
      });

      const titleQuery = interaction.options.getString('title');
      let movieInfoText = '';

      if (titleQuery) {
        const movie = await movieService.resolveMovie(titleQuery);
        if (movie) {
          movieInfoText = `\n\n🎬 **Film:** ${movie.title} ${movie.year ? `(${movie.year})` : ''}\n⭐ **Rating:** ${movie.rating.toFixed(1)}/10`;
        }
      }

      const embed = new EmbedBuilder()
        .setColor(BOT_COLORS.SUCCESS)
        .setTitle(`${EMOJIS.WATCH} Sesi Nonton Bareng Siap!`)
        .setDescription(
          `Sesi streaming resmi **Watch Together** telah dibuat untuk voice channel **${voiceChannel.name}**!${movieInfoText}\n\nKlik tombol hijau di bawah untuk langsung membuka pemutar video di dalam voice channel.`
        )
        .setFooter({ text: 'Fitur resmi Discord Voice Activity • Kualitas HD & Sinkron' })
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('▶ Mulai Nonton di Voice Channel')
          .setStyle(ButtonStyle.Link)
          .setURL(invite.url)
      );

      await interaction.editReply({
        embeds: [embed],
        components: [row],
      });
    } catch (err: any) {
      logger.error({ err: err.message }, 'Error creating Watch Together activity');
      await interaction.editReply({
        embeds: [
          EmbedHelper.error(
            'Gagal Membuka Sesi',
            'Pastikan bot memiliki izin **Create Invite** pada Voice Channel tersebut.'
          ),
        ],
      });
    }
  },
};

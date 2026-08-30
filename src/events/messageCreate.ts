import { Message, GuildMember, InviteTargetType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { movieService } from '../services/movie.service.js';
import { EmbedHelper } from '../utils/embed.builder.js';
import { ButtonHelper } from '../utils/button.builder.js';
import { env } from '../config/env.config.js';
import { BOT_COLORS, EMOJIS } from '../config/constants.js';
import { logger } from '../utils/logger.js';

const WATCH_TOGETHER_APP_ID = '880218394199220334';

export async function handleMessageCreate(message: Message): Promise<void> {
  if (message.author.bot || !message.guild) return;

  const content = message.content.trim();

  // Check if message is a prefix command (e.g. !movie, !stream, /movie, /stream typed as text)
  const isSlashText = content.startsWith('/');
  const isExclamationText = content.startsWith('!');

  if (!isSlashText && !isExclamationText) return;

  const channelName = message.channel && 'name' in message.channel ? (message.channel.name as string).toLowerCase() : '';
  const channelId = message.channelId;

  // Check channel whitelist
  if (env.allowedChannelIds.length > 0 || env.allowedChannelNames.length > 0) {
    const isIdAllowed = env.allowedChannelIds.includes(channelId);
    const isNameAllowed = env.allowedChannelNames.some((n) => channelName.includes(n));
    if (!isIdAllowed && !isNameAllowed) return;
  }

  // Clean command and args
  const rawClean = content.slice(1).trim();
  const [cmd, ...args] = rawClean.split(/\s+/);
  const commandName = cmd.toLowerCase();
  let query = args.join(' ').replace(/^title:\s*/i, '').trim();

  try {
    // 1. STREAM command
    if (commandName === 'stream' || commandName === 'watchtogether') {
      const member = message.member as GuildMember;
      const voiceChannel = member?.voice?.channel;

      if (!voiceChannel) {
        await message.reply({
          embeds: [
            EmbedHelper.error(
              'Harus Masuk Voice Channel',
              'Kamu harus bergabung ke dalam salah satu Voice Channel (misal: **Movie 1**) terlebih dahulu untuk memulai sesi streaming nonton bareng!'
            ),
          ],
        });
        return;
      }

      const invite = await (voiceChannel as any).createInvite({
        targetApplication: WATCH_TOGETHER_APP_ID,
        targetType: InviteTargetType.EmbeddedApplication,
        maxAge: 3600,
      });

      let movieInfoText = '';
      if (query) {
        const movie = await movieService.resolveMovie(query);
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

      await message.reply({
        embeds: [embed],
        components: [row],
      });
      return;
    }

    // 2. MOVIE command
    if (commandName === 'movie' && query) {
      const movie = await movieService.resolveMovie(query);
      if (!movie) {
        await message.reply({
          embeds: [EmbedHelper.error('Tidak Ditemukan', `Tidak dapat menemukan film: **${query}**`)],
        });
        return;
      }

      const embed = EmbedHelper.movieDetailEmbed(movie);
      const actionRow = ButtonHelper.movieActionRow(movie);

      await message.reply({
        embeds: [embed],
        components: [actionRow],
      });
      return;
    }

    // 3. TRENDING command
    if (commandName === 'trending') {
      const trending = await movieService.getTrending();
      if (trending.length === 0) return;

      const embed = new EmbedBuilder()
        .setColor(BOT_COLORS.PRIMARY)
        .setTitle('✨ Film Trending Hari Ini')
        .setDescription(
          trending
            .slice(0, 5)
            .map((item, idx) => `**${idx + 1}.** **${item.title}** ${item.year ? `(${item.year})` : ''} — ⭐ ${item.rating.toFixed(1)}/10\n*${item.overview.slice(0, 100)}...*`)
            .join('\n\n')
        )
        .setThumbnail(trending[0]?.posterUrl || null);

      await message.reply({ embeds: [embed] });
      return;
    }

    // 4. RANDOM command
    if (commandName === 'random') {
      const movie = await movieService.getRandomMovie();
      if (!movie) return;

      const embed = EmbedHelper.movieDetailEmbed(movie);
      const actionRow = ButtonHelper.movieActionRow(movie);

      await message.reply({
        embeds: [embed],
        components: [actionRow],
      });
      return;
    }

    // 5. HELP command
    if (commandName === 'help') {
      const embed = new EmbedBuilder()
        .setColor(BOT_COLORS.PRIMARY)
        .setTitle(`${EMOJIS.MOVIE} Daftar Perintah Bot`)
        .setDescription('Kamu bisa menggunakan Slash Command (`/`) atau mengetik langsung di chat:')
        .addFields(
          { name: '🎬 Nonton Bareng', value: '`!stream` atau `/stream` — Buka pemutar video di voice channel' },
          { name: '🔎 Cari Film', value: '`!movie <judul>` atau `/movie <judul>` — Detail lengkap & tempat nonton' },
          { name: '✨ Eksplorasi', value: '`!trending` — Film tren hari ini\n`!random` — Rekomendasi film acak' }
        );

      await message.reply({ embeds: [embed] });
      return;
    }
  } catch (err: any) {
    logger.error({ err: err.message, content }, 'Error handling messageCreate command');
  }
}

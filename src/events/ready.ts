import { Client, ActivityType, EmbedBuilder, PermissionsBitField } from 'discord.js';
import { logger } from '../utils/logger.js';
import { BOT_COLORS, EMOJIS } from '../config/constants.js';

export function handleReady(client: Client): void {
  logger.info(`✅ Bot successfully logged in as ${client.user?.tag} (ID: ${client.user?.id})`);
  logger.info(`Connected to ${client.guilds.cache.size} server(s).`);

  client.user?.setPresence({
    activities: [
      {
        name: '/movie | /stream 🎬',
        type: ActivityType.Watching,
      },
    ],
    status: 'online',
  });

  // Send startup menu to movie/text channel
  for (const [, guild] of client.guilds.cache) {
    try {
      const channel = guild.channels.cache.find(
        (c) =>
          c.isTextBased() &&
          (c.name.toLowerCase().includes('movie') || c.name.toLowerCase().includes('bot')) &&
          c.permissionsFor(guild.members.me!)?.has(PermissionsBitField.Flags.SendMessages)
      );

      if (channel && channel.isTextBased()) {
        const welcomeEmbed = new EmbedBuilder()
          .setColor(BOT_COLORS.SUCCESS)
          .setTitle(`${EMOJIS.MOVIE} Movie Assistant Telah Online & Siap Digunakan! 🍿`)
          .setDescription(
            'Bot asisten film & streaming resmi siap melayani pencarian film, info ketersediaan legal, trailer, dan sesi nonton bareng di voice channel!'
          )
          .addFields(
            {
              name: '🎬 Menu Utama Film & Streaming',
              value: [
                '`/movie <judul>` — Info lengkap, rating, sinopsis, cast & platform resmi',
                '`/stream [judul]` — Mulai sesi nonton bareng langsung di Voice Channel',
                '`/search <judul>` — Cari daftar film dengan tombol pilihan angka',
                '`/watch <judul|url>` — Temukan tempat nonton atau deteksi link resmi',
                '`/trailer <judul>` — Tonton trailer resmi film di YouTube',
                '`/info <judul>` — Spesifikasi teknis, durasi, dan kru film',
                '`/platform <judul>` — Cek ketersediaan platform streaming resmi',
              ].join('\n'),
            },
            {
              name: '✨ Menu Discovery & Rekomendasi',
              value: [
                '`/trending` — Film terpopuler hari ini',
                '`/top` — Film dengan rating tertinggi sepanjang masa',
                '`/random` — Dapatkan 1 film acak yang berkualitas',
                '`/genre <nama>` — Filter film berdasarkan genre (Action, Sci-Fi, dll.)',
                '`/year <tahun>` — Filter film berdasarkan tahun rilis',
                '`/actor <nama>` — Cari film yang dibintangi aktor tertentu',
                '`/director <nama>` — Cari film karya sutradara tertentu',
                '`/recommend <film>` — Rekomendasi film yang mirip',
              ].join('\n'),
            },
            {
              name: '❤️ Menu Favorit, Watchlist & Riwayat',
              value: [
                '`/favorite add|remove` / `/favorites` — Kelola film favorit',
                '`/watchlist add|remove|list` — Kelola daftar tontonan kamu',
                '`/history` — Lihat atau bersihkan riwayat pencarian',
              ].join('\n'),
            },
            {
              name: 'ℹ️ Menu Sistem',
              value: '`/ping` — Cek latensi • `/stats` — Statistik memori • `/help` — Panduan lengkap',
            }
          )
          .setFooter({ text: '100% Bebas Iklan & Menggunakan Tautan Resmi TMDB / YouTube' })
          .setTimestamp();

        (channel as any).send({ embeds: [welcomeEmbed] }).catch(() => {});
      }
    } catch {
      // Ignored
    }
  }

  // Cycle presence every 10 minutes
  const activities = [
    { name: '/movie <judul> 🎬', type: ActivityType.Watching },
    { name: '/stream nonton bareng 🍿', type: ActivityType.Streaming, url: 'https://youtube.com' },
    { name: '/trending movies ✨', type: ActivityType.Watching },
    { name: '/help for commands 💡', type: ActivityType.Listening },
  ];

  let currentActivity = 0;
  setInterval(() => {
    currentActivity = (currentActivity + 1) % activities.length;
    const act = activities[currentActivity];
    client.user?.setActivity(act.name, { type: act.type as any, url: act.url });
  }, 10 * 60 * 1000).unref();
}

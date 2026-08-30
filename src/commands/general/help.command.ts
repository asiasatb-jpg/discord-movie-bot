import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { SlashCommand } from '../../types/command.types.js';
import { BOT_COLORS, EMOJIS } from '../../config/constants.js';

export const helpCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Tampilkan daftar lengkap perintah dan panduan penggunaan bot'),

  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setColor(BOT_COLORS.PRIMARY)
      .setTitle(`${EMOJIS.MOVIE} Panduan & Perintah Movie Assistant`)
      .setDescription(
        'Bot pencari film & asisten streaming legal. Membantu kamu menemukan film terbaik dan tautan resmi untuk menonton secara legal tanpa pembajakan!'
      )
      .addFields(
        {
          name: '🎬 Pencarian & Info Film',
          value: [
            '`/movie <nama>` — Info lengkap, sinopsis, cast, rating & platform legal',
            '`/search <nama>` — Cari hingga 10 judul film dengan tombol pilihan',
            '`/watch <nama|url>` — Temukan tempat nonton atau deteksi link resmi',
            '`/info <nama>` — Detail spesifikasi, durasi, dan kru film',
            '`/trailer <nama>` — Tonton trailer resmi di YouTube',
            '`/platform <nama>` — Cek ketersediaan layanan streaming resmi',
          ].join('\n'),
        },
        {
          name: '✨ Discovery & Eksplorasi',
          value: [
            '`/trending` — Daftar film paling populer hari ini',
            '`/top` — Film dengan rating tertinggi sepanjang masa',
            '`/random` — Dapatkan rekomendasi film acak',
            '`/genre <genre>` — Filter film berdasarkan genre favorit',
            '`/year <tahun>` — Filter film berdasarkan tahun rilis',
            '`/actor <nama>` — Cari film yang dibintangi aktor/aktris tertentu',
            '`/director <nama>` — Cari film karya sutradara tertentu',
            '`/recommend <film>` — Rekomendasi film yang mirip',
          ].join('\n'),
        },
        {
          name: '❤️ Koleksi & Riwayat',
          value: [
            '`/favorite add <nama>` / `/favorite remove <nama>` — Kelola film favorit',
            '`/favorites` — Lihat seluruh film favorit kamu',
            '`/watchlist add <nama>` / `/watchlist remove` — Kelola watchlist kamu',
            '`/watchlist list` — Tampilkan isi watchlist kamu',
            '`/history` — Lihat atau bersihkan riwayat pencarian kamu',
          ].join('\n'),
        },
        {
          name: 'ℹ️ Utilitas & Status',
          value: [
            '`/ping` — Cek latensi dan responsivitas bot',
            '`/stats` — Statistik performa bot & penggunaan memori',
            '`/help` — Tampilkan menu bantuan ini',
          ].join('\n'),
        }
      )
      .setFooter({
        text: 'Zero Piracy • Hanya Menyediakan Link Resmi & Legal',
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

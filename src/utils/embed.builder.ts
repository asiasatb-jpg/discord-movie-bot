import { EmbedBuilder } from 'discord.js';
import { Movie, MovieSearchResult, WatchLink } from '../types/movie.types.js';
import { BOT_COLORS, EMOJIS } from '../config/constants.js';
import { formatRating, formatRuntime, truncateText } from './formatters.js';

export class EmbedHelper {
  /**
   * Main Movie Details Embed
   */
  public static movieDetailEmbed(movie: Movie): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setColor(BOT_COLORS.PRIMARY)
      .setTitle(`${EMOJIS.MOVIE} ${movie.title} ${movie.year ? `(${movie.year})` : ''}`)
      .setDescription(
        movie.tagline
          ? `*“${movie.tagline}”*\n\n${truncateText(movie.overview, 400)}`
          : truncateText(movie.overview, 450) || '*No synopsis available.*'
      );

    // Rating, Year, Duration, Genre fields
    embed.addFields(
      {
        name: `${EMOJIS.RATING} Rating`,
        value: formatRating(movie.rating, movie.voteCount),
        inline: true,
      },
      {
        name: `${EMOJIS.DURATION} Durasi`,
        value: formatRuntime(movie.runtime),
        inline: true,
      },
      {
        name: `${EMOJIS.GENRE} Genre`,
        value: movie.genres.length > 0 ? movie.genres.join(', ') : 'N/A',
        inline: true,
      }
    );

    // Cast & Directors
    if (movie.directors && movie.directors.length > 0) {
      embed.addFields({
        name: '🎬 Sutradara',
        value: movie.directors.join(', '),
        inline: true,
      });
    }

    if (movie.cast && movie.cast.length > 0) {
      const topCast = movie.cast.slice(0, 4).map((c) => `• ${c.name} *(${c.character || 'Pemeran'})*`).join('\n');
      embed.addFields({
        name: '👥 Pemeran',
        value: topCast,
        inline: false,
      });
    }

    // Availability summary
    if (movie.watchLinks && movie.watchLinks.length > 0) {
      const platforms = Array.from(new Set(movie.watchLinks.map((w) => w.providerName)))
        .slice(0, 5)
        .join(' • ');
      embed.addFields({
        name: `${EMOJIS.WATCH} Tersedia di Platform Resmi`,
        value: platforms || 'Klik tombol **Tempat Nonton** di bawah',
        inline: false,
      });
    } else {
      embed.addFields({
        name: `${EMOJIS.WATCH} Ketersediaan Streaming`,
        value: 'Informasi streaming legal belum tersedia untuk wilayah ini.',
        inline: false,
      });
    }

    if (movie.posterUrl) {
      embed.setThumbnail(movie.posterUrl);
    }

    if (movie.backdropUrl) {
      embed.setImage(movie.backdropUrl);
    }

    embed.setFooter({
      text: 'Movie Assistant • Data resmi legal via TMDB & JustWatch',
    });
    embed.setTimestamp();

    return embed;
  }

  /**
   * Where to Watch Legal Providers Embed
   */
  public static whereToWatchEmbed(movie: Movie, watchLinks: WatchLink[]): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setColor(BOT_COLORS.SUCCESS)
      .setTitle(`🎬 Tempat Nonton Resmi: ${movie.title}`)
      .setDescription(
        'Berikut adalah penyedia layanan streaming resmi dan legal tempat kamu dapat menonton film ini:'
      );

    if (movie.posterUrl) {
      embed.setThumbnail(movie.posterUrl);
    }

    if (!watchLinks || watchLinks.length === 0) {
      embed.addFields({
        name: 'Status Ketersediaan',
        value: 'Informasi streaming legal belum tersedia atau tidak ada layanan resmi di wilayah ini.',
      });
    } else {
      const flatrate = watchLinks.filter((w) => w.providerType === 'flatrate');
      const buyOrRent = watchLinks.filter((w) => w.providerType === 'buy' || w.providerType === 'rent');
      const free = watchLinks.filter((w) => w.providerType === 'free');

      if (flatrate.length > 0) {
        embed.addFields({
          name: '📺 Langganan Streaming (Subscription)',
          value: flatrate.map((p) => `• **${p.providerName}**`).join('\n'),
        });
      }

      if (free.length > 0) {
        embed.addFields({
          name: '🆓 Gratis / Free with Ads',
          value: free.map((p) => `• **${p.providerName}**`).join('\n'),
        });
      }

      if (buyOrRent.length > 0) {
        embed.addFields({
          name: '💳 Sewa / Beli (Rent/Buy)',
          value: Array.from(new Set(buyOrRent.map((p) => p.providerName)))
            .map((name) => `• **${name}**`)
            .join('\n'),
        });
      }
    }

    embed.setFooter({
      text: 'Gunakan tombol link di bawah untuk membuka halaman resmi penyedia',
    });

    return embed;
  }

  /**
   * Search Results List Embed
   */
  public static searchResultsEmbed(query: string, results: MovieSearchResult[]): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setColor(BOT_COLORS.PRIMARY)
      .setTitle(`🔎 Hasil Pencarian: "${query}"`);

    if (results.length === 0) {
      embed.setDescription('Tidak ditemukan film yang cocok dengan kata kunci tersebut.');
      return embed;
    }

    const lines = results.map((m, idx) => {
      const rating = m.rating ? `⭐ ${m.rating.toFixed(1)}` : '⭐ N/A';
      const year = m.year ? `(${m.year})` : '';
      return `**${idx + 1}.** **${m.title}** ${year} — ${rating}\n*${truncateText(m.overview, 90)}*`;
    });

    embed.setDescription(lines.join('\n\n'));
    if (results[0]?.posterUrl) {
      embed.setThumbnail(results[0].posterUrl);
    }
    embed.setFooter({ text: 'Pilih nomor film di bawah untuk melihat detail lengkap' });

    return embed;
  }

  /**
   * Generic Success Embed
   */
  public static success(title: string, message: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(BOT_COLORS.SUCCESS)
      .setTitle(`${EMOJIS.SUCCESS} ${title}`)
      .setDescription(message);
  }

  /**
   * Generic Error Embed
   */
  public static error(title: string, message: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(BOT_COLORS.DANGER)
      .setTitle(`${EMOJIS.ERROR} ${title}`)
      .setDescription(message);
  }

  /**
   * Generic Info Embed
   */
  public static info(title: string, message: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(BOT_COLORS.INFO)
      .setTitle(`${EMOJIS.MOVIE} ${title}`)
      .setDescription(message);
  }
}

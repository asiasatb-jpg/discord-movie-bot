import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { Movie, WatchLink } from '../types/movie.types.js';
import { EMOJIS } from '../config/constants.js';

export class ButtonHelper {
  /**
   * Action buttons for Movie Details Embed
   */
  public static movieActionRow(movie: Movie): ActionRowBuilder<ButtonBuilder> {
    const row = new ActionRowBuilder<ButtonBuilder>();

    // 1. Where to Watch Button
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`watch_info_${movie.id}`)
        .setLabel('Tempat Nonton')
        .setEmoji(EMOJIS.WATCH)
        .setStyle(ButtonStyle.Primary)
    );

    // 2. Official Trailer Button (Link Button if available)
    if (movie.officialTrailerUrl) {
      row.addComponents(
        new ButtonBuilder()
          .setLabel('Tonton Trailer')
          .setEmoji(EMOJIS.TRAILER)
          .setStyle(ButtonStyle.Link)
          .setURL(movie.officialTrailerUrl)
      );
    }

    // 3. Add to Favorite Button
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`fav_add_${movie.id}`)
        .setLabel('Favorit')
        .setEmoji(EMOJIS.FAVORITE)
        .setStyle(ButtonStyle.Secondary)
    );

    // 4. Add to Watchlist Button
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`wl_add_${movie.id}`)
        .setLabel('Watchlist')
        .setEmoji(EMOJIS.WATCHLIST)
        .setStyle(ButtonStyle.Secondary)
    );

    return row;
  }

  /**
   * Generates Link Buttons for Legal Watch Providers
   */
  public static watchLinksRows(watchLinks: WatchLink[]): ActionRowBuilder<ButtonBuilder>[] {
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    const buttons: ButtonBuilder[] = [];

    // Prioritize flatrate (Subscription) and official links
    const seen = new Set<string>();

    for (const link of watchLinks) {
      if (!link.url || seen.has(link.providerName)) continue;
      seen.add(link.providerName);

      const btn = new ButtonBuilder()
        .setLabel(`Buka ${link.providerName.slice(0, 70)}`)
        .setStyle(ButtonStyle.Link)
        .setURL(link.url);

      buttons.push(btn);
      if (buttons.length >= 5) break; // Discord allows max 5 buttons per row
    }

    if (buttons.length > 0) {
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
      rows.push(row);
    }

    return rows;
  }

  /**
   * Action buttons for selecting an item from search results (1 to 5)
   */
  public static searchSelectionRow(
    itemCount: number,
    prefix = 'select_movie_'
  ): ActionRowBuilder<ButtonBuilder> {
    const row = new ActionRowBuilder<ButtonBuilder>();
    const count = Math.min(itemCount, 5);

    for (let i = 1; i <= count; i++) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`${prefix}${i - 1}`)
          .setLabel(`[${i}]`)
          .setStyle(ButtonStyle.Secondary)
      );
    }

    return row;
  }
}

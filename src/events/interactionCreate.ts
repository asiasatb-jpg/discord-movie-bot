import {
  Interaction,
  Collection,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  ButtonInteraction,
  GuildMember,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { SlashCommand } from '../types/command.types.js';
import { rateLimiter } from '../middleware/rate-limiter.js';
import { statsService } from '../services/stats.service.js';
import { handleFavoriteButton } from '../buttons/favorite.button.js';
import { handleWatchlistButton } from '../buttons/watchlist.button.js';
import { handleWatchInfoButton } from '../buttons/watch-info.button.js';
import { i18n } from '../locales/i18n.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.config.js';

export async function handleInteractionCreate(
  interaction: Interaction,
  commands: Collection<string, SlashCommand>
): Promise<void> {
  try {
    // 1. Handle Autocomplete
    if (interaction.isAutocomplete()) {
      const autocompleteInt = interaction as AutocompleteInteraction;
      const command = commands.get(autocompleteInt.commandName);
      if (command && command.autocomplete) {
        await command.autocomplete(autocompleteInt);
      }
      return;
    }

    // 2. Handle Button Interactions
    if (interaction.isButton()) {
      const buttonInt = interaction as ButtonInteraction;
      statsService.recordButton();

      if (buttonInt.customId.startsWith('fav_add_')) {
        await handleFavoriteButton(buttonInt);
        return;
      }

      if (buttonInt.customId.startsWith('wl_add_')) {
        await handleWatchlistButton(buttonInt);
        return;
      }

      if (buttonInt.customId.startsWith('watch_info_')) {
        await handleWatchInfoButton(buttonInt);
        return;
      }

      if (buttonInt.customId.startsWith('stream_voice_')) {
        const member = buttonInt.member as GuildMember;
        const voiceChannel = member?.voice?.channel;

        if (!voiceChannel) {
          await buttonInt.reply({
            content: '⚠️ Kamu harus masuk ke salah satu Voice Channel (seperti **Movie 1**) terlebih dahulu untuk mulai nonton bareng!',
            ephemeral: true,
          });
          return;
        }

        try {
          const invite = await (voiceChannel as any).createInvite({
            targetApplication: '880218394199220334',
            targetType: 2, // InviteTargetType.EmbeddedApplication
            maxAge: 3600,
          });

          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel(`▶ Buka Layar Nonton di ${voiceChannel.name}`)
              .setStyle(ButtonStyle.Link)
              .setURL(invite.url)
          );

          await buttonInt.reply({
            content: `🍿 Sesi Nonton Bareng di channel **${voiceChannel.name}** siap! Klik tombol di bawah untuk langsung membuka pemutar video:`,
            components: [row],
            ephemeral: true,
          });
        } catch (err: any) {
          logger.error({ err: err.message }, 'Error launching stream from button');
          await buttonInt.reply({
            content: 'Gagal membuat sesi streaming. Pastikan bot memiliki izin Create Invite di voice channel tersebut.',
            ephemeral: true,
          });
        }
        return;
      }

      // Other custom button events handled by inline collectors
      return;
    }

    // 3. Handle Slash Commands
    if (interaction.isChatInputCommand()) {
      const chatInt = interaction as ChatInputCommandInteraction;
      const command = commands.get(chatInt.commandName);

      if (!command) {
        logger.warn(`Command not found: ${chatInt.commandName}`);
        return;
      }

      // Check Channel Whitelist if configured
      if (
        (env.allowedChannelIds.length > 0 || env.allowedChannelNames.length > 0) &&
        !command.adminOnly
      ) {
        const channelId = chatInt.channelId;
        const channelName = chatInt.channel && 'name' in chatInt.channel ? (chatInt.channel.name as string).toLowerCase() : '';

        const isIdAllowed = env.allowedChannelIds.includes(channelId);
        const isNameAllowed = env.allowedChannelNames.some((n) => channelName.includes(n));

        if (!isIdAllowed && !isNameAllowed) {
          await chatInt.reply({
            content: `⚠️ Perintah bot film ini hanya dapat digunakan di channel yang telah ditentukan (seperti channel **Movie**).`,
            ephemeral: true,
          });
          return;
        }
      }

      // Check Rate Limit for normal users
      const rateLimit = await rateLimiter.checkLimit(chatInt.user.id);
      if (rateLimit.isLimited) {
        await chatInt.reply({
          content: i18n.t('errors.rate_limit_exceeded', {
            seconds: rateLimit.remainingSeconds || 10,
          }),
          ephemeral: true,
        });
        return;
      }

      statsService.recordCommand();
      logger.info(
        {
          command: chatInt.commandName,
          user: chatInt.user.tag,
          userId: chatInt.user.id,
          guild: chatInt.guild?.name || 'DM',
        },
        'Executing slash command'
      );

      await command.execute(chatInt);
    }
  } catch (err: any) {
    logger.error({ err: err.message, stack: err.stack }, 'Unhandled error in interaction handler');

    if (interaction.isRepliable()) {
      const payload = {
        content: i18n.t('errors.generic_error'),
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
  }
}

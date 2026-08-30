import { ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import { env } from '../config/env.config.js';

export function isBotAdmin(interaction: ChatInputCommandInteraction): boolean {
  const userId = interaction.user.id;

  // Check explicit ADMIN_USER_IDS list from environment
  if (env.adminUserIds.includes(userId)) {
    return true;
  }

  // Check Discord Guild Administrator permission
  if (interaction.guild && interaction.memberPermissions) {
    if (interaction.memberPermissions.has(PermissionsBitField.Flags.Administrator)) {
      return true;
    }
  }

  return false;
}

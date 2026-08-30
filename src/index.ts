import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { env } from './config/env.config.js';
import { getCommandsCollection } from './commands/index.js';
import { handleReady } from './events/ready.js';
import { handleInteractionCreate } from './events/interactionCreate.js';
import { handleMessageCreate } from './events/messageCreate.js';
import { handleError } from './events/error.js';
import { logger } from './utils/logger.js';
import { prisma } from './database/prisma.js';

// Create Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

// Load commands
const commands = getCommandsCollection();
logger.info(`Loaded ${commands.size} slash commands.`);

// Register Event Handlers
client.once('ready', () => handleReady(client));
client.on('interactionCreate', (interaction) => handleInteractionCreate(interaction, commands));
client.on('messageCreate', (message) => handleMessageCreate(message));
client.on('error', handleError);

// Graceful Shutdown
async function shutdown(signal: string) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  try {
    client.destroy();
    await prisma.$disconnect();
    logger.info('Bot destroyed and database disconnected. Goodbye!');
    process.exit(0);
  } catch (err: any) {
    logger.error({ err: err.message }, 'Error during shutdown');
    process.exit(1);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Global Exception Catchers
process.on('unhandledRejection', (reason: any) => {
  logger.error({ err: reason?.message || reason }, 'Unhandled Rejection detected');
});

process.on('uncaughtException', (error: Error) => {
  logger.fatal({ err: error.message, stack: error.stack }, 'Uncaught Exception detected');
});

// Login to Discord
client.login(env.DISCORD_TOKEN).catch((err) => {
  logger.fatal({ err: err.message }, 'Failed to login to Discord');
  process.exit(1);
});

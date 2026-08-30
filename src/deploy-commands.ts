import { REST, Routes } from 'discord.js';
import { env } from './config/env.config.js';
import { commandsList } from './commands/index.js';
import { logger } from './utils/logger.js';

async function deployCommands() {
  const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);
  const commandsData = commandsList.map((cmd) => cmd.data.toJSON());

  try {
    logger.info(`Started refreshing ${commandsData.length} application (/) commands...`);

    if (env.DISCORD_GUILD_ID) {
      logger.info(`Deploying commands to Guild: ${env.DISCORD_GUILD_ID}`);
      await rest.put(
        Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID),
        { body: commandsData }
      );
    } else {
      logger.info('Deploying commands globally across Discord.');
      await rest.put(
        Routes.applicationCommands(env.DISCORD_CLIENT_ID),
        { body: commandsData }
      );
    }

    logger.info('✅ Successfully reloaded application (/) commands.');
  } catch (error: any) {
    logger.error({ err: error.message }, 'Failed to deploy slash commands');
    process.exit(1);
  }
}

deployCommands();

import { Client, ActivityType } from 'discord.js';
import { logger } from '../utils/logger.js';

export function handleReady(client: Client): void {
  logger.info(`✅ Bot successfully logged in as ${client.user?.tag} (ID: ${client.user?.id})`);
  logger.info(`Connected to ${client.guilds.cache.size} server(s).`);

  client.user?.setPresence({
    activities: [
      {
        name: '/movie | /help 🎬',
        type: ActivityType.Watching,
      },
    ],
    status: 'online',
  });

  // Cycle presence every 10 minutes
  const activities = [
    { name: '/movie <title> 🎬', type: ActivityType.Watching },
    { name: 'Legal Streaming Links 🍿', type: ActivityType.Streaming, url: 'https://youtube.com' },
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

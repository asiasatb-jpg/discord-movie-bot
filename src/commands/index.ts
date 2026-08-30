import { Collection } from 'discord.js';
import { SlashCommand } from '../types/command.types.js';

// Movie commands
import { movieCommand } from './movie/movie.command.js';
import { searchCommand } from './movie/search.command.js';
import { watchCommand } from './movie/watch.command.js';
import { infoCommand } from './movie/info.command.js';
import { trailerCommand } from './movie/trailer.command.js';
import { platformCommand } from './movie/platform.command.js';

// Discovery commands
import { randomCommand } from './discovery/random.command.js';
import { trendingCommand } from './discovery/trending.command.js';
import { topCommand } from './discovery/top.command.js';
import { genreCommand } from './discovery/genre.command.js';
import { yearCommand } from './discovery/year.command.js';
import { actorCommand } from './discovery/actor.command.js';
import { directorCommand } from './discovery/director.command.js';
import { recommendCommand } from './discovery/recommend.command.js';

// User commands
import { favoriteCommand } from './user/favorite.command.js';
import { favoritesCommand } from './user/favorites.command.js';
import { watchlistCommand } from './user/watchlist.command.js';
import { historyCommand } from './user/history.command.js';

// General & Admin commands
import { helpCommand } from './general/help.command.js';
import { pingCommand } from './general/ping.command.js';
import { statsCommand } from './general/stats.command.js';
import { adminCommand } from './admin/admin.command.js';

export const commandsList: SlashCommand[] = [
  movieCommand,
  searchCommand,
  watchCommand,
  infoCommand,
  trailerCommand,
  platformCommand,
  randomCommand,
  trendingCommand,
  topCommand,
  genreCommand,
  yearCommand,
  actorCommand,
  directorCommand,
  recommendCommand,
  favoriteCommand,
  favoritesCommand,
  watchlistCommand,
  historyCommand,
  helpCommand,
  pingCommand,
  statsCommand,
  adminCommand,
];

export function getCommandsCollection(): Collection<string, SlashCommand> {
  const commands = new Collection<string, SlashCommand>();
  for (const cmd of commandsList) {
    commands.set(cmd.data.name, cmd);
  }
  return commands;
}

import Honeybadger from '@honeybadger-io/js';
import { container, SapphireClient, SapphireClientOptions } from '@sapphire/framework';
import '@sapphire/plugin-logger/register';
import { ScheduledTaskRedisStrategy } from '@sapphire/plugin-scheduled-tasks/register-redis';
import { env } from './env';
import { MongoClient } from 'mongodb';
import { ModelStore } from './structures';

import type { Message } from 'discord.js';
import { ChatInputCommandsData } from './managers';

export class ConfeBot extends SapphireClient {
  public version = process.env.npm_package_version || '2.0.0-dev';

  constructor(options: SapphireClientOptions) {
    super({
      allowedMentions: {
        parse: ['roles', 'users']
      },
      defaultPrefix: 'c!',
      intents: ['GUILDS', 'GUILD_PRESENCES', 'GUILD_MEMBERS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS'],
      tasks: {
        strategy: new ScheduledTaskRedisStrategy({
          bull: env.REDIS_URI
        })
      },
      ...options
    });

    container.stores.register(new ModelStore());
		this.chatInputCommandsData = new ChatInputCommandsData();
  }

  public fetchPrefix = async (message: Message): Promise<string> => {
    if (!message.guildId) return 'c!';
    const model = container.stores.get('models').get('guild');
    return model.getPrefix(message.guildId);
  };

  logException(err: Error, context: Record<string, unknown> = {}): void {
    if (Object.keys(context).length) container.logger.error(err, '\nContext:', context);
    else container.logger.error(err);

    if (env?.HONEYBADGER_API_KEY) {
      Honeybadger.resetContext(context);
      Honeybadger.notify(err);
    }
  }

  async login(token: string): Promise<string> {
    // do pre-login stuff
    const client = new MongoClient(env.DB_URI);
    await client.connect();
    container.mongodb = client.db();
    this.logger.log = this.logger.info;
    if (env.HONEYBADGER_API_KEY) {
      Honeybadger.configure({
        apiKey: env.HONEYBADGER_API_KEY,
        environment: process.env.NODE_ENV === 'production' ? 'prod' : 'dev',
        logger: this.logger,
        revision: this.version
      });
    } else this.logger.warn('HONEYBADGER_API_KEY not set, error reporting disabled.');

    return super.login(token);
  }
}

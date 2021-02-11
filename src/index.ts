// eslint-disable-next-line import/order
import { env, loadEnv } from './environment';

import { Signale } from 'signale';
import Honeybadger from '@honeybadger-io/js';
import {
  AkairoClient,
  CommandHandler,
  ListenerHandler
} from 'discord-akairo';

loadEnv();

declare module 'discord-akairo' {
  interface AkairoClient {
    commandHandler: CommandHandler,
    listenerHandler: ListenerHandler,
    logger: Signale,
    logException(err: Error, context?: any): void,
	version: string,
    // set during the 'ready' event
    cache: {
	  widgetInvite: {
        code: string
        uses: number
      }
    }
  }
}

class ConfeBot extends AkairoClient {
  constructor() {
    super({
      ownerID: env.OWNER_ID
    }, {
      allowedMentions: {
        parse: ['roles', 'users']
      },
      ws: {
        intents: ['GUILDS', 'GUILD_PRESENCES', 'GUILD_MEMBERS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS']
      }
    });

    this.version = process.env.npm_package_version || '1.0.0';

    const loggerConfig = {
      secrets: [env.DISCORD_TOKEN]
    };

    if (env.HONEYBADGER_API_KEY) loggerConfig.secrets.push(env.HONEYBADGER_API_KEY);

    this.logger = new Signale(loggerConfig);

    if (env.HONEYBADGER_API_KEY) {
      Honeybadger.configure({
        apiKey: env.HONEYBADGER_API_KEY,
        environment: process.env.NODE_ENV === 'production' ? 'prod' : 'dev',
        logger: this.logger,
        revision: this.version
      });
    } else this.logger.warn('HONEYBADGER_API_KEY not set, error reporting disabled.');

    this.logException = (err: Error, context: any = {}): void => {
      if (Object.keys(context).length) this.logger.error(err, '\nContext:', context);
      else this.logger.error(err);

      if (env.HONEYBADGER_API_KEY) {
        Honeybadger.resetContext(context);
        Honeybadger.notify(err);
      }
    };

    this.listenerHandler = new ListenerHandler(this, {
      directory: './events',
      extensions: process.env.TS_NODE_DEV ? ['.js', '.ts'] : ['.js']
    });

    this.commandHandler = new CommandHandler(this, {
      directory: './commands',
      extensions: process.env.TS_NODE_DEV ? ['.js', '.ts'] : ['.js'],
      prefix: 'c!'
    });
  }

  start(): void {
    this.logger.info(`ConfeBot v${this.version} is starting`);

    this.logger.info('Environment:', env);
    this.listenerHandler.loadAll();
    this.commandHandler.loadAll();
    this.login(env.DISCORD_TOKEN);
  }
}

const client = new ConfeBot();
client.start();

export default ConfeBot;

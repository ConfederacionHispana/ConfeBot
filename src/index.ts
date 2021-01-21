// eslint-disable-next-line import/order
import { env, loadEnv } from './environment';
import { hostname } from 'os';

import {
  Logger, createLogger, format as logFormat, transports as logTransports
} from 'winston';
import LogzioWinstonTransport from 'winston-logzio';

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
    logger: Logger,
    version: string
  }
}

class ConfeBot extends AkairoClient {
  constructor() {
    super({
      ownerID: env.OWNER_ID
    }, {
      disableMentions: 'everyone',
      ws: {
        intents: ['GUILDS', 'GUILD_PRESENCES', 'GUILD_MEMBERS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS']
      }
    });

    this.version = '1.0.0';

    this.logger = createLogger({
      level: 'info',
      format: logFormat.json(),
      defaultMeta: {
        environment: process.env.NODE_ENV === 'production' ? 'prod' : 'dev',
        hostname: hostname(),
        version: this.version
      },
      transports: [
        new logTransports.Console({
          format: logFormat.cli()
        })
      ]
    });

    if (env.LOGZIO_TOKEN) {
      this.logger.add(new LogzioWinstonTransport({
        level: 'info',
        name: 'winston_logzio',
        token: env.LOGZIO_TOKEN
      }));
    } else this.logger.warn('Logz.io reporting disabled');

    this.listenerHandler = new ListenerHandler(this, {
      directory: './events',
      extensions: process.env.TS_NODE_DEV ? ['.js', '.ts'] : ['.js']
    });

    this.commandHandler = new CommandHandler(this, {
      directory: './commands',
      extensions: process.env.TS_NODE_DEV ? ['.js', '.ts'] : ['.js'],
      prefix: '!'
    });
  }

  async start() {
    this.logger.info(`ConfeBot v${this.version} is starting`);
    console.log(env);
    this.listenerHandler.loadAll();
    this.commandHandler.loadAll();
    this.login(env.DISCORD_TOKEN);
  }
}

const client = new ConfeBot();
client.start();

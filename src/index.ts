// eslint-disable-next-line import/order
import { env, loadEnv } from './environment';

import {
  Logger, createLogger, format as logFormat, transports as logTransports
} from 'winston';

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
      disableMentions: 'everyone'
    });

    this.version = '1.0.0';

    this.logger = createLogger({
      level: 'info',
      format: logFormat.json(),
      transports: [
        new logTransports.Console({
          format: logFormat.cli()
        })
      ]
    });

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
    console.log(env);
    this.listenerHandler.loadAll();
    this.commandHandler.loadAll();
    this.login(env.DISCORD_TOKEN);
  }
}

const client = new ConfeBot();
client.start();

import { SapphireClient, SapphireClientOptions, Store } from '@sapphire/framework';
import '@sapphire/plugin-logger/register';
import Honeybadger from '@honeybadger-io/js';

import { env } from './env';

class ConfeBot extends SapphireClient {
  constructor(options: SapphireClientOptions) {
    super({
      allowedMentions: {
        parse: ['roles', 'users']
      },
      intents: ['GUILDS', 'GUILD_PRESENCES', 'GUILD_MEMBERS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS'],
      ...options
    });

    Store.injectedContext.client = this;
  }

  public version = process.env.npm_package_version || '2.0.0-dev';

  public fetchPrefix = () => 'c!';

  public get context() {
    return Store.injectedContext;
  }

  logException(err: Error, context: Record<string, unknown> = {}) {
    if (Object.keys(context).length) Store.injectedContext.client.logger.error(err, '\nContext:', context);
    else Store.injectedContext.client.logger.error(err);

    if (env.HONEYBADGER_API_KEY) {
      Honeybadger.resetContext(context);
      Honeybadger.notify(err);
    }
  }

  async login(token: string) {
    // do preparations
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

export { ConfeBot };

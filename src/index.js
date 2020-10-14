import { AkairoClient, ListenerHandler } from 'discord-akairo';
import { Signale } from 'signale';
import Rollbar from 'rollbar';
import { name as packageName,
  version as packageVersion } from '../package.json';

class ConfeBot extends AkairoClient {
  constructor() {
    super({
      ownerID: process.env.OWNER_ID,
    }, {
      disableMentions: 'everyone'
    });
    this.version = packageVersion;
    this.logger = new Signale();
    this.rollbar = new Rollbar({
      accessToken: process.env.ROLLBAR_TOKEN,
      captureUncaught: true,
      captureUnhandledRejections: true
    });
    this.listenerHandler = new ListenerHandler(this, {
      directory: './src/events/'
    });
  }
}

const client = new ConfeBot();
client.logger.start(`${packageName} v${packageVersion}`);
client.rollbar.info(`${packageName} v${packageVersion} is starting`);
client.listenerHandler.loadAll();
client.login(process.env.DISCORD_TOKEN);
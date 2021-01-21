import { Listener } from 'discord-akairo';
import { TextChannel } from 'discord.js';
import DiscordTransport from 'winston-discordjs';
import { env } from '../environment';

class ReadyListener extends Listener {
  constructor() {
    super('ready', {
      emitter: 'client',
      event: 'ready'
    });
  }

  exec(): void {
    const systemLogChannel = this.client.channels.resolve(env.SYSLOG_CHANNEL);
    if (systemLogChannel instanceof TextChannel) {
      this.client.logger.add(new DiscordTransport({
        discordChannel: systemLogChannel
      }));
    } else this.client.logger.warn('Discord reporting disabled');

    this.client.logger.info('Received ready event', {
      source: 'discord'
    });

    if (this.client.user) {
      this.client.user.setPresence({
        activity: {
          name: `${this.client.users.cache.size} usuarios | version ${this.client.version}`
        },
        status: 'online'
      }).catch((err) => this.client.logger.error('Error setting status', { err }));
    }
  }
}

export default ReadyListener;

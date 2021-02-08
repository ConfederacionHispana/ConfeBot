import { Listener } from 'discord-akairo';
import { CronJob } from 'cron';
import KickNonVerifiedMembers from '../tasks/KickNonVerifiedMembers';

class ReadyListener extends Listener {
  constructor() {
    super('ready', {
      emitter: 'client',
      event: 'ready'
    });
  }

  exec(): void {
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

    const scheduledTask = new CronJob('0 * * * *', () => KickNonVerifiedMembers(this.client), null, true);

    scheduledTask.start();
    scheduledTask.fireOnTick();
  }
}

export default ReadyListener;

import { Listener } from 'discord-akairo';
import { CronJob } from 'cron';
import { env } from '../environment';
import KickNonVerifiedMembers from '../tasks/KickNonVerifiedMembers';

class ReadyListener extends Listener {
  constructor() {
    super('ready', {
      emitter: 'client',
      event: 'ready'
    });
  }

  async exec(): Promise<void> {
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

    const guild = this.client.guilds.resolve(env.GUILD_ID);
    const invites = await guild?.fetchInvites();
    const widgetInvite = invites?.find((invite) => !invite.inviter);
    if (!widgetInvite) return this.client.logger.warn('No he podido encontrar una invitación por widget.');
    this.client.cache.widgetInvite = {
      code: widgetInvite.code,
      uses: widgetInvite.uses ?? 0
    };
    this.client.logger.info(`Se ha registrado la invitación del widget: ${widgetInvite.code} (${widgetInvite.uses} usos).`);
  }
}

export default ReadyListener;

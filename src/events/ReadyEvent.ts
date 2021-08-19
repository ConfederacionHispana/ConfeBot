import { ApplyOptions } from '@sapphire/decorators';
import { Event, Events, EventOptions } from '@sapphire/framework';
import { join } from 'path';

import { env } from '#lib/env';
import { TaskStore } from '#lib/structures/TaskStore';

@ApplyOptions<EventOptions>({
  event: Events.Ready,
  once: true
})
class ReadyEvent extends Event {
  public async run(): Promise<void> {
    const { client } = this.context;

    client.logger.info('Received ready event', {
      source: 'discord'
    });

    client.user?.setPresence({
      activities: [
        {
          type: 'WATCHING',
          name: `${client.users.cache.size} usuarios | version ${client.version}`
        }
      ],
      status: 'online'
    });

    const guild = client.guilds.resolve(env.GUILD_ID);
    const invites = await guild?.fetchInvites();
    const widgetInvite = invites?.find((invite) => !invite.inviter);
    if (!widgetInvite) return client.logger.warn('No he podido encontrar una invitación por widget.');
    client.cache.widgetInvite = {
      code: widgetInvite.code,
      uses: widgetInvite.uses ?? 0
    };
    client.logger.info(`Se ha registrado la invitación del widget: ${widgetInvite.code} (${widgetInvite.uses} usos).`);

    client.stores.register(new TaskStore().registerPath(join(__dirname, '..', 'tasks')));
    (client.stores.get('tasks')! as TaskStore).loadAll().catch(client.logException);
  }
}

export default ReadyEvent;

import { ApplyOptions } from '@sapphire/decorators';
import { Event, Events, EventOptions } from '@sapphire/framework';
import { join } from 'path';

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

    client.stores.register(new TaskStore().registerPath(join(__dirname, '..', 'tasks')));
    (client.stores.get('tasks')! as TaskStore).loadAll();
  }
}

export default ReadyEvent;

import { ApplyOptions } from '@sapphire/decorators';
import { Event, Events, EventOptions } from '@sapphire/framework';

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

    // TODO: setup scheduled tasks
  }
}

export default ReadyEvent;

import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { env } from '@confebot/lib';

import type { ListenerOptions } from '@sapphire/framework';

@ApplyOptions<ListenerOptions>({
  event: Events.ClientReady,
  once: true
})
export class ReadyListener extends Listener {
  public async run(): Promise<void> {
    const { client } = this.container;

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
    const invites = await guild?.invites?.fetch();
    const widgetInvite = invites?.find((invite) => !invite.inviter);
    if (widgetInvite) {
      client.cache.widgetInvite = {
        code: widgetInvite.code,
        uses: widgetInvite.uses ?? 0
      };
      client.logger.info(
        `Se ha registrado la invitación del widget: ${widgetInvite.code} (${widgetInvite.uses} usos).`
      );
    }
  }
}

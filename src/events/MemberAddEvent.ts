import { ApplyOptions } from '@sapphire/decorators';
import { Event, Events, EventOptions } from '@sapphire/framework';

import type { GuildMember } from 'discord.js';

@ApplyOptions<EventOptions>({
  event: Events.GuildMemberAdd
})
class MemberAddEvent extends Event {
  public async run(member: GuildMember): Promise<void> {
    const { client } = this.context;

    client.logger.info('Nuevo miembro', {
      userId: member.user.id,
      userTag: `${member.user.username}#${member.user.discriminator}`,
      source: 'user-log'
    });
  }
}

export default MemberAddEvent;

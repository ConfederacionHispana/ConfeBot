import { ApplyOptions } from '@sapphire/decorators';
import { Event, Events, EventOptions } from '@sapphire/framework';

import type { GuildMember } from 'discord.js';

@ApplyOptions<EventOptions>({
  event: Events.GuildMemberAdd
})
class MemberAddEvent extends Event {
  public run(member: GuildMember): void {
    this.logNewMember(member);
    this.checkAccountAge(member);
  }

  private logNewMember(member: GuildMember): void {
    const { client } = this.context;

    client.logger.info('Nuevo miembro', {
      userId: member.user.id,
      userTag: `${member.user.username}#${member.user.discriminator}`,
      source: 'user-log'
    });
  }

  private checkAccountAge(member: GuildMember): void {
    const SECONDS_IN_DAY = 1000 * 60 * 60 * 24;
    const created = member.user.createdAt.getTime();
    const now = Date.now();
    const age = Math.floor((now - created) / SECONDS_IN_DAY);
    if (age < MemberAddEvent.MINIMUM_DAYS_AGE) {
      const { client } = this.context;
      member.kick(`Cuenta creada hace menos de 3 días.`).catch((e) => {
        client.logException(e, {
          userId: member.user.id,
          userTag: member.user.tag,
          source: 'user-log'
        });
      });
      client.logger.info('Miembro expulsado', {
        userId: member.user.id,
        userTag: member.user.tag,
        source: 'user-log'
      });
    }
  }

  static MINIMUM_DAYS_AGE = 3;
}

export default MemberAddEvent;

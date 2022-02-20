import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { Time } from '../lib';

import type { ListenerOptions } from '@sapphire/framework';
import type { GuildMember } from 'discord.js';

@ApplyOptions<ListenerOptions>({
  event: Events.GuildMemberAdd
})
export class MemberAddListener extends Listener {
  static MINIMUM_DAYS_AGE = 3;

  public run(member: GuildMember): void {
    this.logNewMember(member);
    this.checkAccountAge(member);
  }

  private logNewMember(member: GuildMember): void {
    const { client } = this.container;

    client.logger.info('Nuevo miembro', {
      userId: member.user.id,
      userTag: `${member.user.username}#${member.user.discriminator}`,
      source: 'user-log'
    });
  }

  private checkAccountAge(member: GuildMember): void {
    const created = member.user.createdAt.getTime();
    const now = Date.now();
    const age = Math.floor((now - created) / Time.Day);
    if (age < MemberAddListener.MINIMUM_DAYS_AGE) {
      const { client } = this.container;
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
}

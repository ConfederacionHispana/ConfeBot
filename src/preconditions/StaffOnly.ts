import type { PreconditionOptions, PreconditionResult } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { env } from '../lib/env';
import type { CommandInteraction, GuildMemberRoleManager, Message } from 'discord.js';
import { Precondition } from '@sapphire/framework';

@ApplyOptions<PreconditionOptions>({
  name: 'StaffOnly'
})
export class UserPrecondition extends Precondition {
  public evaluate(hasRole: boolean | null): PreconditionResult {
    return hasRole
      ? this.ok()
      : this.error({
        identifier: 'StaffOnly',
        message: `Necesitas el rol de <@&${process.env.STAFF_ROLE}> para usar este comando.`
      });
  }

  public messageRun(message: Message): PreconditionResult {
    return this.evaluate(message.author.id === '697553237867364362' || (message.member && message.member.roles.cache.has(env.STAFF_ROLE)));
  }

  public chatInputRun(interaction: CommandInteraction<'cached' | 'raw'>): PreconditionResult {
    return this.evaluate(interaction.user.id === '697553237867364362' || (interaction.member && (interaction.member.roles as GuildMemberRoleManager).cache.has(env.STAFF_ROLE)));
  }
}

declare module '@sapphire/framework' {
  interface Preconditions {
    StaffOnly: never;
  }
}

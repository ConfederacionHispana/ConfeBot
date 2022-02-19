import type { PreconditionOptions, PreconditionResult } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { env } from '../lib/env';
import type { CommandInteraction, Message } from 'discord.js';
import { Precondition } from '@sapphire/framework';

@ApplyOptions<PreconditionOptions>({
  name: 'StaffOnly'
})
export class UserPrecondition extends Precondition {
  public allowedRoles = [env.STAFF_ROLE];

  public run(hasRole: boolean | null): PreconditionResult {
    return hasRole
      ? this.ok()
      : this.error({
        identifier: 'StaffOnly',
        message: `Necesitas el rol de <@&${process.env.STAFF_ROLE}> para usar este comando.`
      });
  }

  public messageRun(message: Message): PreconditionResult {
    return this.run(message.member && message.member.roles.cache.has(env.STAFF_ROLE));
  }

  public chatInputRun(interaction: CommandInteraction<'present'>): PreconditionResult {
    const hasRole = Array.isArray(interaction.member.roles)
      ? interaction.member.roles.includes(env.STAFF_ROLE)
      : interaction.member.roles.cache.has(env.STAFF_ROLE);
    
    return this.run(hasRole);
  }
}

declare module '@sapphire/framework' {
  interface Preconditions {
    StaffOnly: never;
  }
}

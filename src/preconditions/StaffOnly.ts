import type { PreconditionOptions, PreconditionResult } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { env } from '../lib/env';
import type { Message } from 'discord.js';
import { Precondition } from '@sapphire/framework';

@ApplyOptions<PreconditionOptions>({
  name: 'StaffOnly'
})
export class UserPrecondition extends Precondition {
  public run(message: Message): PreconditionResult {
    return message.member && message.member.roles.cache.has(env.STAFF_ROLE)
      ? this.ok()
      : this.error({
        context: { message },
        identifier: 'StaffOnly',
        message: `Necesitas el rol de <@&${process.env.STAFF_ROLE}> para usar este comando.`
      });
  }
}

declare module '@sapphire/framework' {
  interface Preconditions {
    StaffOnly: never;
  }
}

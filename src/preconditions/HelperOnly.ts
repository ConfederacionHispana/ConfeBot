import type { PreconditionOptions, PreconditionResult } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import type { Message } from 'discord.js';
import { Precondition } from '@sapphire/framework';

@ApplyOptions<PreconditionOptions>({
  name: 'HelperOnly'
})
export class UserPrecondition extends Precondition {
  public run(message: Message): PreconditionResult {
    return message.author.id === process.env.HELPER_ROLE
      ? this.ok()
      : this.error({
          context: { message },
          identifier: 'HELPER_ONLY',
          message: `Necesitas el rol de <@&${process.env.HELPER_ROLE}> para usar este comando.`
        });
  }
}

declare module '@sapphire/framework' {
  interface Preconditions {
    HelperOnly: never;
  }
}

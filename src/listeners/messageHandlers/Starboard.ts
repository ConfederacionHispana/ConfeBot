import { ApplyOptions } from '@sapphire/decorators';
import { env } from '#lib/env';
import { Events, Listener } from '@sapphire/framework';
import { sleep } from '#lib/util/sleep';

import type { ListenerOptions } from '@sapphire/framework';
import type { Message } from 'discord.js';

@ApplyOptions<ListenerOptions>({
  event: Events.MessageCreate
})
export class StatsListener extends Listener {
  public async run(message: Message): Promise<void> {
    if (message.channelId !== env.STARBOARD_CHANNEL) return;
    if (message.member?.roles.cache.has(env.STAFF_ROLE) || message.author.bot) return;
    if (message.attachments.size > 0) return;

    await message.delete().catch(() => null);
    const notification = await message.channel
      .send(
        `<@!${message.author.id}>, he eliminado tu mensaje para evitar conversaciones en el canal. Recuerda que <#${env.STARBOARD_CHANNEL}> es sólo para compartir capturas, no para hablar.`
      )
      .catch(() => null);
    if (notification) {
      await sleep(10000);
      await notification.delete().catch(() => null);
    }
  }
}

import { ApplyOptions } from '@sapphire/decorators';
import { env, sleep } from '@confebot/lib';
import { Events, Listener } from '@sapphire/framework';

import type { ListenerOptions } from '@sapphire/framework';
import type { Message } from 'discord.js';

@ApplyOptions<ListenerOptions>({
  event: Events.MessageCreate
})
export class StatsListener extends Listener {
  public starboard?: string;

  public async run(message: Message): Promise<void> {
    if (
      !message.guildId ||
      message.member?.roles.cache.has(env.STAFF_ROLE) ||
      message.author.bot ||
      message.attachments.size > 0
    )
      return;

    const starboard = await this.getStarboard(message.guildId);
    if (!starboard || message.channelId !== starboard) return;

    await message.delete().catch(() => null);
    const notification = await message.channel
      .send(
        `<@!${message.author.id}>, he eliminado tu mensaje para evitar conversaciones en el canal. Recuerda que <#${starboard}> es sólo para compartir capturas, no para hablar.`
      )
      .catch(() => null);
    if (notification) {
      await sleep(10000);
      await notification.delete().catch(() => null);
    }
  }

  private async getStarboard(guildId: string): Promise<string | null> {
    if (!this.starboard) {
      const settings = await this.container.settingsManager.getGuildSettings(guildId);
      this.starboard = settings.channels?.starboard;
    }
    return this.starboard ?? null;
  }
}

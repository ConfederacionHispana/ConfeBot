import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';

import type { ListenerOptions } from '@sapphire/framework';
import type { Message } from 'discord.js';

@ApplyOptions<ListenerOptions>({
  event: Events.MessageCreate
})
export class StatsListener extends Listener {
  public async run(message: Message): Promise<void> {
    const { client, statsManager } = this.container;
    if (!message.guild || message.author.bot) return;

    if (/^simps?\.?$/.test(message.content)) {
      const simps = client.guilds.cache.get(message.guild.id)?.memberCount;
      await statsManager.incrementGuildStat(message.guild.id, 'simps');
    }

    if (/^f\.?$/.test(message.content)) {
      await statsManager.incrementGuildStat(message.guild.id, 'f');
    }
  }
}

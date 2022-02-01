import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';

import type { ListenerOptions } from '@sapphire/framework';
import type { Message } from 'discord.js';

@ApplyOptions<ListenerOptions>({
  event: Events.MessageCreate
})
export class StatsListener extends Listener {
  public async run(message: Message): Promise<void> {
    const { statsManager } = this.container;
    const prefix = ((await this.container.client.fetchPrefix(message)) || 'c!') as string;

    if (!message.guild || message.author.bot || message.content.includes(prefix)) return;

    if (/^simps?\.?$/.test(message.content)) {
      await statsManager.incrementGuildStat(message.guild.id, 'simps');
    }

    if (/^f\.?$/.test(message.content)) {
      await statsManager.incrementGuildStat(message.guild.id, 'f');
    }

    if (message.content.includes('aDarkGames')) {
      await statsManager.incrementGuildStat(message.guild.id, 'aDarkGames');
    }
  }
}

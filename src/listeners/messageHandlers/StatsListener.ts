import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';

import type { ListenerOptions } from '@sapphire/framework';
import type { Message } from 'discord.js';

@ApplyOptions<ListenerOptions>({
  event: Events.MessageCreate
})
export class StatsListener extends Listener {
  public async run(message: Message): Promise<void> {
    if (!message.guildId) return

    const model = this.container.stores.get('models').get('guild')
    const prefix = await model.getPrefix(message.guildId)

    if (!message.guild || message.author.bot || message.content.includes(prefix)) return;

    const matches = message.content.match(/(simps?|f|adarkgames)\b/gi)
    if (!matches) return
    const counted = new Set<string>()
    for (const match of matches) {
      const stat = match.toLowerCase() === 'simp' ? 'simps' : match.toLowerCase()
      if (counted.has(stat)) continue
      counted.add(stat)
      await model.addStat(message.guildId, stat)
    }
  }
}

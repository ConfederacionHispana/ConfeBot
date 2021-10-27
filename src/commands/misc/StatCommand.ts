import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, CommandOptions, UserError } from '@sapphire/framework';

import type { Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
  aliases: ['stat', 'count']
})
export class StatCommand extends Command {
  public async messageRun(message: Message, args: Args) {
    const { client, statsManager } = this.container;

    try {
      const stat = await args.pick('string');
      const statValue = await statsManager.getGuildStat(message.guild!.id, stat);

      return message.reply(`Cantidad de \`${stat}\`: **${statValue ?? 'sin valor'}**.`);
    } catch (err) {
      if (err instanceof Error) {
        if (err instanceof UserError) {
          return message.channel.send('Se debe especificar el nombre de la estadística a obtener.');
        }
        client.logException(err);
      }
    }
    return null; // TODO: remove this
  }
}

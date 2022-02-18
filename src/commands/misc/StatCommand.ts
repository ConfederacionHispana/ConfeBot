import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, CommandOptions, UserError } from '@sapphire/framework';

import type { Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
  aliases: ['stat', 'count']
})
export class StatCommand extends Command {
  public async messageRun(message: Message, args: Args): Promise<void> {
    if ( !message.guildId ) return

    const { client } = this.container;

    try {
      const stat = await args.pick('string');
      const model = this.container.stores.get( 'models' ).get( 'guild' )
      const statValue = await model.getStat( message.guildId, stat )

      void message.reply(`Cantidad de \`${stat}\`: **${statValue ?? 'sin valor'}**.`);
      return;
    } catch (err) {
      if (err instanceof Error) {
        if (err instanceof UserError) {
          void message.channel.send('Se debe especificar el nombre de la estadística a obtener.');
          return;
        }
        client.logException(err);
      }
    }
  }
}

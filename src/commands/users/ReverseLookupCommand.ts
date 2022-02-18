import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';

import type { Args, CommandOptions } from '@sapphire/framework';
import type { Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
  aliases: ['reverselookup', 'finduser']
})
export class ReverseLookupCommand extends Command {
  public async messageRun(message: Message, args: Args): Promise<void> {
    const { client } = this.container;

    const fandomUserMatch = await args.restResult('string');
    if (!fandomUserMatch.success) {
      message.reply('❌ Debes ingresar un nombre de usuario para buscar.').catch(client.logException);
      return;
    }

    const fandomUser = fandomUserMatch.value;
    const model = this.container.stores.get('models').get('user')
    const dbUser = await model.findUserByName(fandomUser)

    if (!dbUser) {
      message
        .reply('❌ No se encontró un usuario de Discord que coincida con la cuenta especificada.')
        .catch(client.logException);
      return;
    }

    message
      .reply({
        embeds: [
          {
            title: 'Resultados de la búsqueda',
            color: 'RANDOM',
            description: `Se encontró el siguiente usuario de Discord para la cuenta de Fandom **${fandomUser}**:\n<@!${dbUser.id}>`
          }
        ]
      })
      .catch(client.logException);
  }
}

import { Command } from 'discord-akairo';
import type { Message } from 'discord.js';

import DBModels from '../../db';

class ReverseLookupCommand extends Command {
  constructor() {
    super('reverselookup', {
      aliases: ['reverselookup', 'finduser'],
      args: [
        {
          id: 'fandomUser',
          type: 'string'
        }
      ]
    });
  }

  async exec(msg: Message, args: { fandomUser?: string }): Promise<void> {
    if (!args.fandomUser) {
      msg.reply('❌ Debes ingresar un nombre de usuario para buscar.').catch(this.client.logException);
      return;
    }
    const { fandomUser } = args;
    const dbUser = await DBModels.User.findOne({
      'fandomUser.username': fandomUser
    });

    if (!dbUser) {
      msg.reply('❌ No se encontró un usuario de Discord que coincida con la cuenta especificada.').catch(this.client.logException);
      return;
    }

    msg.reply({
      embed: {
        title: 'Resultados de la búsqueda',
        color: 'RANDOM',
        description: `Se encontró el siguiente usuario de Discord para la cuenta de Fandom **${fandomUser}**:\n<@!${dbUser.id}>`
      }
    }).catch(this.client.logException);
  }
}

export default ReverseLookupCommand;

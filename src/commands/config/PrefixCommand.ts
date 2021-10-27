import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, CommandOptions, UserError } from '@sapphire/framework';
import { Permissions } from 'discord.js';

import type { Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
  aliases: ['prefix']
})
export class PrefixCommand extends Command {
  public async messageRun(message: Message, args: Args) {
    const { client, settingsManager } = this.container;
    if (!message.guild) {
      return message.channel.send('Este comando solo puede ejecutarse en un servidor.');
    }
    const settings = await settingsManager.getGuildSettings(message.guild.id);

    try {
      const newPrefix = await args.pick('string');
      if (message.member?.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) {
        await settingsManager.setGuildSettings(message.guild.id, {
          ...settings,
          prefix: newPrefix
        });
        return message.channel.send(`Prefix cambiado a: \`${newPrefix}\``);
      }
      return message.reply('No tienes permisos para cambiar el prefijo.');
    } catch (err) {
      if (err instanceof Error) {
        if (err instanceof UserError) {
          return message.reply(`El prefix actual es: \`${settings.prefix}\``);
        }
        client.logException(err);
        return message.channel.send('Ocurrió un error al intentar cambiar el prefix.');
      }
    }
    return null; // TODO: remove this
  }
}

import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, CommandOptions, UserError } from '@sapphire/framework';
import { Permissions } from 'discord.js';

import type { Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
  aliases: ['prefix']
})
export class PrefixCommand extends Command {
  public async messageRun(message: Message, args: Args): Promise<void> {
    const { client, settingsManager } = this.container;
    if (!message.guild) {
      void message.channel.send('Este comando solo puede ejecutarse en un servidor.');
      return;
    }
    const settings = await settingsManager.getGuildSettings(message.guild.id);

    try {
      const newPrefix = await args.pick('string');
      if (message.member?.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) {
        await settingsManager.setGuildSettings(message.guild.id, {
          ...settings,
          prefix: newPrefix
        });
        void message.channel.send(`Prefix cambiado a: \`${newPrefix}\``);
        return;
      }
      void message.reply('No tienes permisos para cambiar el prefijo.');
      return;
    } catch (err) {
      if (err instanceof Error) {
        if (err instanceof UserError) {
          void message.reply(`El prefix actual es: \`${settings.prefix}\``);
          return;
        }
        client.logException(err);
        void message.channel.send('Ocurrió un error al intentar cambiar el prefix.');
      }
    }
  }
}

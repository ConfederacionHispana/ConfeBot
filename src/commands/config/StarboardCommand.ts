import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, CommandOptions, UserError } from '@sapphire/framework';
import { Permissions } from 'discord.js';

import type { Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
  aliases: ['starboard']
})
export class StarboardCommand extends Command {
  public async messageRun(message: Message, args: Args): Promise<void> {
    const { client, settingsManager } = this.container;
    if (!message.guild) {
      void message.channel.send('Este comando solo puede ejecutarse en un servidor.');
      return;
    }
    const settings = await settingsManager.getGuildSettings(message.guild.id);

    try {
      const channel = await args.pick('channel').catch(() => null);
      if (!channel) {
        if (settings.channels?.starboard) {
          void message.channel.send(`Canal de pines: <#${settings.channels.starboard}>`);
        }
        return;
      }

      if (message.member?.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) {
        await settingsManager.setGuildSettings(message.guild.id, {
          ...settings,
          channels: {
            starboard: channel.id
          }
        });
        void message.channel.send(`Canal de pines: <#${channel.id}>`);
        return;
      }
      void message.reply('No tienes permisos para cambiar el canal de pines.');
      return;
    } catch (err) {
      if (err instanceof Error) {
        client.logException(err);
        void message.channel.send('Ocurrió un error al intentar cambiar el canal de pines.');
      }
    }
  }
}

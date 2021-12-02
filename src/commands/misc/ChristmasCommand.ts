import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions } from '@sapphire/framework';

import type { Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
  aliases: ['navidad', 'christmas', 'xmas']
})
export class ChristmasCommand extends Command {
  public async messageRun(message: Message): Promise<void> {
    const { client } = this.container;
    const now = new Date();
    const navidad = new Date('2021-12-25T00:00:00-04:00');
    const diff = new Date(navidad.getTime() - now.getTime());

    try {
      if (diff.getTime() > 0) {
        await message.reply(
          `🎄 Faltan ${
            diff.getUTCDate() - 1
          } días, ${diff.getHours()} horas, ${diff.getMinutes()} minutos y ${diff.getSeconds()} segundos para navidad. uwu ✨`
        );
      } else {
        await message.reply('🎉 Es navidad!! 🥂🎄🎁');
      }
    } catch (error) {
      if (error instanceof Error) {
        client.logException(error);
      }
    }
  }
}

import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions } from '@sapphire/framework';

import type { Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
  aliases: ['ping']
})
export class PingCommand extends Command {
  public messageRun(message: Message): Promise<void> {
    const { client } = this.container;
    message.reply(`Pong! ConfeBot v${client.version}`).catch(client.logException);
  }
}

import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions } from '@sapphire/framework';

import type { Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
  aliases: ['ping']
})
class PingCommand extends Command {
  public run(message: Message) {
    const { client } = this.context;
    message.reply(`Pong! ConfeBot v${client.version}`).catch(client.logException);
  }
}

export default PingCommand;

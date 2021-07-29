import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';

import type { CommandOptions } from '@sapphire/framework';
import type { Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
  aliases: ['ping']
})
class PingCommand extends Command {
  public async run(message: Message) {
    message.reply('Pong!');
  }
}

export default PingCommand;

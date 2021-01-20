import { Command } from 'discord-akairo';
import { Message } from 'discord.js';

class PingCommand extends Command {
  constructor() {
    super('ping', {
      aliases: ['ping']
    });
  }

  exec(message: Message): void {
    message.reply('pong!');
  }
}

export default PingCommand;

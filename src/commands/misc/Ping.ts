import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions } from '@sapphire/framework';

import type { CommandInteraction, Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
  aliases: ['ping'],
  chatInputApplicationOptions: {},
  description: 'Pong!',
  name: 'ping'
})
export class PingCommand extends Command {
  protected get reply(): string {
    return `Pong! ConfeBot v${this.container.client.version}`;
  }

  public messageRun(message: Message): void {
    void message.reply(this.reply);
  }

  public chatInputApplicationRun(interaction: CommandInteraction): void {
    void interaction.reply(this.reply);
  }
}

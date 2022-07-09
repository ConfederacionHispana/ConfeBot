import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, Command, CommandOptions } from '@sapphire/framework';

import type { CommandInteraction, Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
  aliases: ['ping'],
  description: 'Pong!',
  name: 'ping'
})
export class PingCommand extends Command {
  protected get reply(): string {
    return `Pong! ConfeBot v${this.container.client.version}`;
  }

  public override async registerApplicationCommands(registry: ApplicationCommandRegistry): Promise<void> {
    registry.registerChatInputCommand(
      builder => builder
        .setName(this.name)
        .setDescription(this.description),
      await this.container.stores.get('models').get('command').getData(this.name)
    );
  }

  public messageRun(message: Message): void {
    void message.reply(this.reply);
  }

  public chatInputRun(interaction: CommandInteraction): void {
    void interaction.reply(this.reply);
  }
}

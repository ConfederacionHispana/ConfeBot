import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, Args, Command, CommandOptions, UserError } from '@sapphire/framework';

import type { CommandInteraction, Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
  aliases: ['count'],
  description: 'Consulta las estadísticas de una palabra.',
  name: 'stat'
})
export class StatCommand extends Command {
  public override registerApplicationCommands(registry: ApplicationCommandRegistry): void {
    registry.registerChatInputCommand(
      {
        description: this.description,
        name: this.name,
        options: [
          {
            description: 'Palabra a consultar',
            name: 'palabra',
            required: true,
            type: 'STRING'
          }
        ]
      },
      this.container.client.chatInputCommandsData.get(this.name)
    );
  }

  public async run(guildId: string, stat: string): Promise<string> {
    const model = this.container.stores.get('models').get('guild');
    const count = await model.getStat(guildId, stat);
    const value = count === 0 ? 'sin valor' : count;
    return `Cantidad de \`${stat}\`: **${value}**.`;
  }

  public async messageRun(message: Message, args: Args): Promise<void> {
    if (!message.guildId) return;

    const stat = await args.pick('string')
      .catch(() => null);
    
    if (!stat) {
      void message.channel.send('Se debe especificar el nombre de la estadística a obtener.');
      return;
    }

    const reply = await this.run(message.guildId, stat);
    void message.reply(reply);
  }

  public async chatInputRun(interaction: CommandInteraction<'present'>): Promise<void> {
    await interaction.deferReply();
    const stat = interaction.options.getString('palabra', true);
    const reply = await this.run(interaction.guildId, stat);
    void interaction.editReply(reply);
  }
}

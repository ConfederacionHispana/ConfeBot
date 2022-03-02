import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, CommandOptions, container } from '@sapphire/framework';

import type { CommandInteraction, Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
  aliases: ['count'],
  chatInputApplicationOptions: {
    description: 'Consulta las estadísticas de una palabra',
    name: 'stat',
    options: [
      {
        description: 'Palabra a consultar',
        name: 'palabra',
        required: true,
        type: 'STRING'
      }
    ]
  },
  name: 'stat'
})
export class StatCommand extends Command {
  public async evaluate(guildId: string, stat: string): Promise<string> {
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

    const reply = await this.evaluate(message.guildId, stat);
    void message.reply(reply);
  }

  public async chatInputApplicationRun(interaction: CommandInteraction<'present'>): Promise<void> {
    await interaction.deferReply();
    const stat = interaction.options.getString('palabra', true);
    const reply = await this.evaluate(interaction.guildId, stat);
    void interaction.editReply(reply);
  }
}

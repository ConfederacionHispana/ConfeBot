import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, CommandOptions, container } from '@sapphire/framework';
import { CommandInteraction, Permissions } from 'discord.js';

import type { Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
  chatInputApplicationOptions: {
    description: 'Configura (o consulta) el canal de pines',
    name: 'starboard',
    options: [
      {
        channelTypes: ['GUILD_TEXT'],
        description: 'Configurar canal de pines',
        name: 'canal',
        required: false,
        type: 'CHANNEL'
      }
    ]
  },
  name: 'starboard',
  runIn: 'GUILD_ANY'
})
export class StarboardCommand extends Command {
  public async evaluate(guildId: string, channelId?: string, permissions?: Permissions): Promise<string> {
    const model = this.container.stores.get('models').get('guild');
    const oldChannel = await model.getChannel(guildId, 'starboard');
    if (!channelId) {
      if (oldChannel) {
        return `Canal de pines: <#${oldChannel}>`;
      }
      return `No hay un canal de pines configurado.`;

    } else if (permissions?.has(Permissions.FLAGS.MANAGE_GUILD)) {
      await model.setChannel(guildId, 'starboard', channelId);
      return `Se ha configurado el canal de pines: <#${channelId}>.`;
    }
    return 'No tienes permisos para cambiar el canal de pines.';

  }

  public async messageRun(message: Message, args: Args): Promise<void> {
    if (!message.guildId) return;
    const channel = await args.pick('guildTextChannel')
      .catch(() => null);

    const reply = await this.evaluate(message.guildId, channel?.id, message.member?.permissions);
    void message.reply(reply);
  }

  public async chatInputApplicationRun(interaction: CommandInteraction<'present'>): Promise<void> {
    await interaction.deferReply();
    const channel = interaction.options.getChannel('canal');
    const guild = interaction.guild ?? await this.container.client.guilds.fetch(interaction.guildId);
    const member = await guild.members.fetch(interaction.user.id)
      .catch(() => null);

    const reply = await this.evaluate(interaction.guildId, channel?.id, member?.permissions);
    void interaction.editReply(reply);
  }
}

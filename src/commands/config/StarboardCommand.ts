import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, Args, Command, CommandOptions } from '@sapphire/framework';
import { CommandInteraction, Permissions } from 'discord.js';

import type { Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
  description: 'Configura (o consulta) el canal de pines',
  name: 'starboard',
  runIn: 'GUILD_ANY'
})
export class StarboardCommand extends Command {
  public override registerApplicationCommands(registry: ApplicationCommandRegistry): void {
    registry.registerChatInputCommand(
      {
        description: this.description,
        name: this.name,
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
      this.container.client.chatInputCommandsData.get(this.name)
    );
  }

  public async run(guildId: string, channelId?: string, permissions?: Permissions): Promise<string> {
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

    const reply = await this.run(message.guildId, channel?.id, message.member?.permissions);
    void message.reply(reply);
  }

  public async chatInputRun(interaction: CommandInteraction<'present'>): Promise<void> {
    await interaction.deferReply();
    const channel = interaction.options.getChannel('canal');
    const guild = interaction.guild ?? await this.container.client.guilds.fetch(interaction.guildId);
    const member = await guild.members.fetch(interaction.user.id)
      .catch(() => null);

    const reply = await this.run(interaction.guildId, channel?.id, member?.permissions);
    void interaction.editReply(reply);
  }
}

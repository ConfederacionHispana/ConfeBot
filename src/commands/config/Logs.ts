import { ApplyOptions } from '@sapphire/decorators';
import { Command, type CommandOptions } from '@sapphire/framework';
import { type CommandInteraction } from 'discord.js';
import { env } from '../../lib';

@ApplyOptions<CommandOptions>({
  chatInputApplicationOptions: {
    defaultPermission: false,
    options: [
      {
        description: 'Especifica el canal donde se enviarán las notificaciones.',
        name: 'canal',
        options: [
          {
            channelTypes: [
              'GUILD_NEWS', 'GUILD_TEXT'
            ],
            description: 'Mención del canal',
            name: 'canal',
            required: true,
            type: 'CHANNEL'
          }
        ],
        type: 'SUB_COMMAND'
      },
    ],
    permissions: [
      {
        id: env.STAFF_ROLE,
        permission: true,
        type: 'ROLE'
      }
    ]
  },
  description: 'Configura el sistema de logging del servidor.',
  name: 'logs'
})
export class LogsCommand extends Command {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public messageRun(): void {

  }

  public async chatInputApplicationRun(interaction: CommandInteraction<'present'>): Promise<void> {
    await interaction.deferReply();

    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'canal': {
        await this.setLogsChannel(interaction);
        break;
      }

      default: {
        await interaction.editReply('No reconozco el comando que has utilizado.');
      }
    }
  }

  private async setLogsChannel(interaction: CommandInteraction<'present'>): Promise<void> {
    const channel = interaction.options.getChannel('canal', true);
    const guild = this.container.stores.get('models').get('guild');

    await guild.setChannel(interaction.guildId, 'logs', channel.id);

    await interaction.editReply({
      embeds: [{
        color: 0x1b5e20,
        description: `Canal de logs cambiado a: <#${ channel.id }>`
      }]
    });
  }
}

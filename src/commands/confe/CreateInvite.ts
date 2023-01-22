import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, Args, Command } from '@sapphire/framework';
import { env } from '../../lib';

import type { CommandOptions } from '@sapphire/framework';
import { CommandInteraction, Guild, Message, MessageEmbed, Permissions, TextChannel, User } from 'discord.js';

@ApplyOptions<CommandOptions>({
  aliases: ['create-invite'],
  description: 'Crea una invitación al servidor',
  flags: ['guest'],
  name: 'invite',
  preconditions: ['StaffOnly'],
  runIn: 'GUILD_ANY'
})
export class CreateInviteCommand extends Command {
  public override async registerApplicationCommands(registry: ApplicationCommandRegistry): Promise<void> {
    registry.registerChatInputCommand(
      builder => builder
        .setName(this.name)
        .setDescription(this.description)
        .setDefaultMemberPermissions(Permissions.FLAGS.MANAGE_GUILD)
        .addNumberOption((option) => option
          .setName('usos')
          .setDescription('Cantidad de usos de la invitación. Por defecto, un solo uso')),
      await this.container.stores.get('models').get('command').getData(this.name)
    );
  }

  public async createInvite(user: User, guild: Guild, uses: number): Promise<MessageEmbed> {
    try {
      const channel = await guild.channels.fetch(env.WELCOME_CHANNEL) as TextChannel;
      const invite = await channel.createInvite({
        maxAge: 24 * 60 * 60,
        maxUses: uses,
        reason: `Invitación solicitada por ${user.tag}`
      });

      return new MessageEmbed({
        title: 'Invitación creada',
        description: `Enlace de invitación: ${invite.url}`,
        color: 'GREEN'
      });
    } catch (err) {
      return new MessageEmbed({
        title: 'No se pudo crear la invitación',
        description: `Ocurrió un error: ${err.message}`,
        color: 'RED'
      });
    }
  }

  public async messageRun(message: Message, args: Args): Promise<void> {
    if (!message.guild) return;

    const usesMatch = await args.pickResult('number');
    const reply = await this.createInvite(message.author, message.guild, usesMatch.value ?? 1);

    void message.reply({
      embeds: [reply]
    });
  }

  public async chatInputRun(interaction: CommandInteraction<'cached' | 'raw'>): Promise<void> {
    if (!interaction.guild) return;
    await interaction.deferReply();

    const uses = interaction.options.getNumber('usos');
    const reply = await this.createInvite(interaction.user, interaction.guild, uses ?? 1);

    void interaction.editReply({
      embeds: [reply]
    });
  }
}

import { ApplyOptions } from '@sapphire/decorators';
import { Command, container } from '@sapphire/framework';
import { CommandInteraction, Guild, GuildMember, MessageEmbed, ReplyMessageOptions, User } from 'discord.js';

import type { Args, CommandOptions } from '@sapphire/framework';
import type { Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
  aliases: ['lookup', 'userlookup', 'userinfo'],
  chatInputApplicationOptions: {
    description: 'Consulta la información de un miembro del servidor',
    guildIds: container.client.applicationCommandsGuilds,
    name: 'user-lookup',
    options: [
      {
        description: 'Usuario a consultar',
        name: 'usuario',
        required: true,
        type: 'USER'
      }
    ]
  },
  name: 'user-lookup',
  runIn: 'GUILD_ANY'
})
export class UserLookupCommand extends Command {
  public static readonly userStatus = {
    online: 'Conectado',
    offline: 'Desconectado',
    idle: 'Ausente',
    dnd: 'No Molestar',
    invisible: 'Invisible',
    unknown: 'Desconocido'
  };

  public async evaluate(user: User, guild: Guild): Promise<ReplyMessageOptions>
  public async evaluate(user: GuildMember): Promise<ReplyMessageOptions>
  public async evaluate(user: GuildMember | User, guild?: Guild): Promise<ReplyMessageOptions> {
    const member = user instanceof GuildMember
      ? user
      : await guild?.members.fetch(user.id).catch(() => null);
    if (!member) {
      return {
        content: `El usuario no se encuentra en el servidor.`
      };
    }

    const model = this.container.stores.get('models').get('user');
    const dbUser = await model.findUserBySnowflake(member.user.id);

    const embed = new MessageEmbed()
      .setTitle(`Información de **${member.user.username}#${member.user.discriminator}**`)
      .setColor(member.displayColor)
      .setThumbnail(member.user.displayAvatarURL())
      .addField('Registro', member.user.createdAt.toString())
      .addField('En el servidor desde', member.joinedAt?.toString() ?? 'Nunca');

    if (dbUser && dbUser.fandomUser)
      embed.addField('Cuenta de Fandom', `${dbUser.fandomUser.username} (${dbUser.fandomUser.userId})`);

    embed
      .addField(
        'Roles',
        member.roles.cache.map((role) => (role.id === '@everyone' ? role.id : `<@&${role.id}>`)).join(', ')
      )
      .addField('ID', member.user.id)
      .addField('Estado', UserLookupCommand.userStatus[member.presence?.status ?? 'unknown']);

    return {
      embeds: [embed]
    };
  }

  public async messageRun(message: Message, args: Args): Promise<void> {
    const member = await args.pick('member')
      .catch(() => null);
    if (!member) {
      void message.reply('❓ No encontré al usuario que buscas.');
      return;
    }

    const reply = await this.evaluate(member);
    void message.reply(reply);
  }

  public async chatInputApplicationRun(interaction: CommandInteraction<'present'>): Promise<void> {
    await interaction.deferReply();
    const user = interaction.options.getUser('usuario', true);
    const guild = interaction.guild ?? await this.container.client.guilds.fetch(interaction.guildId);
    const reply = await this.evaluate(user, guild);
    void interaction.editReply(reply);
  }
}

import { Command } from 'discord-akairo';
import { GuildMember, Message } from 'discord.js';

class LookupUserCommand extends Command {
  constructor() {
    super('lookup', {
      aliases: ['lookup', 'userinfo'],
      args: [
        {
          id: 'member',
          type: 'member'
        }
      ]
    });
  }

  exec(msg: Message, args: { member?: GuildMember }): void {
    if (!args.member) {
      msg.reply('❓ No encontré al usuario que buscas.');
      return;
    }
    const { member } = args;
    msg.reply({
      embed: {
        color: member.displayColor,
        title: `Información de **${member.user.username}#${member.user.discriminator}**`,
        thumbnail: {
          url: member.user.displayAvatarURL()
        },
        fields: [
          {
            name: 'Registro',
            value: member.user.createdAt
          },
          {
            name: 'En el servidor desde',
            value: member.joinedAt
          },
          {
            name: 'Cuenta de Fandom',
            value: 'a'
          },
          {
            name: 'Roles',
            value: member.roles.cache.map((role) => (role.id === '@everyone' ? role.id : `<@&${role.id}>`)).join(', ')
          },
          {
            name: 'ID',
            value: member.user.id
          },
          {
            name: 'Estado',
            value: member.presence.status
          }
        ]
      }
    });
  }
}

export default LookupUserCommand;

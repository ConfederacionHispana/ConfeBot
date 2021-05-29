import { Command } from 'discord-akairo';
import { GuildMember, Message, MessageEmbed } from 'discord.js';

import DBModels from '../../db';

class UserLookupCommand extends Command {
  constructor() {
    super('lookup', {
      aliases: ['lookup', 'userlookup', 'userinfo'],
      args: [
        {
          id: 'member',
          type: 'member'
        }
      ]
    });
  }

  async exec(msg: Message, args: { member?: GuildMember }): Promise<void> {
    if (!args.member) {
      msg.reply('❓ No encontré al usuario que buscas.').catch(this.client.logException);
      return;
    }
    const { member } = args;
    const dbUser = await DBModels.User.findOne({ id: member.user.id });

    const embed = new MessageEmbed()
      .setTitle(`Información de **${member.user.username}#${member.user.discriminator}**`)
      .setColor(member.displayColor)
      .setThumbnail(member.user.displayAvatarURL())
      .addField('Registro', member.user.createdAt)
      .addField('En el servidor desde', member.joinedAt);

    if (dbUser && dbUser.fandomUser) embed.addField('Cuenta de Fandom', `${dbUser.fandomUser.username} (${dbUser.fandomUser.userId})`);

    embed.addField('Roles', member.roles.cache.map((role) => (role.id === '@everyone' ? role.id : `<@&${role.id}>`)).join(', '))
      .addField('ID', member.user.id)
      .addField('Estado', member.presence.status);

    msg.reply({ embed }).catch(this.client.logException);
  }
}

export default UserLookupCommand;

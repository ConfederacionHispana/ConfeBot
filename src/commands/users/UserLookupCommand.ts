import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';
import DBModels from '../../db';

import type { Args, CommandOptions } from '@sapphire/framework';
import type { Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
  aliases: ['lookup', 'userlookup', 'userinfo']
})
class UserLookupCommand extends Command {
  public async run(message: Message, args: Args) {
    const { client } = this.context;

    const targetMemberResult = await args.pickResult('member');
    if (!targetMemberResult.success) {
      message
        .reply('❓ No encontré al usuario que buscas.')
        .catch(client.logException);
      return;
    }

    const member = targetMemberResult.value;
    const dbUser = await DBModels.User.findOne({ id: member.user.id });

    const embed = new MessageEmbed()
      .setTitle(
        `Información de **${member.user.username}#${member.user.discriminator}**`
      )
      .setColor(member.displayColor)
      .setThumbnail(member.user.displayAvatarURL())
      .addField('Registro', member.user.createdAt)
      .addField('En el servidor desde', member.joinedAt);

    if (dbUser && dbUser.fandomUser)
      embed.addField(
        'Cuenta de Fandom',
        `${dbUser.fandomUser.username} (${dbUser.fandomUser.userId})`
      );

    embed
      .addField(
        'Roles',
        member.roles.cache
          .map((role) => (role.id === '@everyone' ? role.id : `<@&${role.id}>`))
          .join(', ')
      )
      .addField('ID', member.user.id)
      .addField('Estado', member.presence.status);

    message.reply({ embed }).catch(client.logException);
  }
}

export default UserLookupCommand;

import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { MessageEmbed } from 'discord.js';
import DBModels from '../../db';

import type { Args, CommandOptions } from '@sapphire/framework';
import type { Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
  aliases: ['lookup', 'userlookup', 'userinfo']
})
export class UserLookupCommand extends Command {
  public async messageRun(message: Message, args: Args) {
    const { client } = this.container;

    const targetMemberResult = await args.pickResult('member');
    if (!targetMemberResult.success) {
      message.reply('❓ No encontré al usuario que buscas.').catch(client.logException);
      return;
    }

    const member = targetMemberResult.value;
    const dbUser = await DBModels.User.findOne({ id: member.user.id });
    const userStatus = {
      online: 'Conectado',
      offline: 'Desconectado',
      idle: 'Ausente',
      dnd: 'No Molestar',
      invisible: 'Invisible',
      unknown: 'Desconocido'
    }

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
      .addField('Estado', userStatus[member.presence?.status ?? 'unknown']);

    message.reply({ embeds: [embed] }).catch(client.logException);
  }
}

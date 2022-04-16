import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener, type ListenerOptions } from '@sapphire/framework';
import { type BaseGuildTextChannel, type Message, MessageEmbed } from 'discord.js';
import { messageDiff } from '../lib/util';

@ApplyOptions<ListenerOptions>({
  event: Events.MessageUpdate,
})
export class MessageUpdateListener extends Listener {
  public async run(oldMessage: Message, newMessage: Message): Promise<void> {
    const { client } = this.container;

    if (!oldMessage.guild || !newMessage.guild) return;

    const guild = this.container.stores.get('models').get('guild'),
      logsChannelId = await guild.getChannel(newMessage.guild.id, 'logs'),
      logsChannel = newMessage.guild.channels.cache.get(logsChannelId!) as BaseGuildTextChannel;

    // TODO: log to database

    if (!logsChannel) {
      client.logger.info(`No logs channel configured for ${newMessage.guild.name}`);
      return;
    }

    const diff = messageDiff(oldMessage.content, newMessage.content);

    const embed = new MessageEmbed()
      .setTitle(`Mensaje editado en **#${(newMessage.channel as BaseGuildTextChannel).name}**`)
      .setColor('#00bcd4')
      .setAuthor({
        name: newMessage.author.tag,
        iconURL: newMessage.author.displayAvatarURL()
      })
      .setDescription(`[Ver mensaje](${newMessage.url})`)
      .setTimestamp();

    if (oldMessage.content.length) {
      embed.addField('Antes', oldMessage.content.length > 1024 ? `${oldMessage.content.slice(0, 1021)}...` : oldMessage.content, false);
    }

    embed.addField('Después', newMessage.content.length > 1024 ? `${newMessage.content.slice(0, 1021)}...` : newMessage.content, false);

    if (oldMessage.content.length) {
      embed.addField('Cambios', diff);
    }

    await logsChannel.send({
      embeds: [embed]
    });
  }
}

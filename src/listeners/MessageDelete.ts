import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener, type ListenerOptions } from '@sapphire/framework';
import { MessageEmbed, type BaseGuildTextChannel, type Message } from 'discord.js';

@ApplyOptions<ListenerOptions>({
  event: Events.MessageDelete,
})
export class MessageDeleteListener extends Listener {
  public async run(message: Message): Promise<void> {
    const { client } = this.container;

    if (!message.guild) return;

    const guild = this.container.stores.get('models').get('guild'),
      logsChannelId = await guild.getChannel(message.guild.id, 'logs'),
      logsChannel = message.guild.channels.cache.get(logsChannelId!) as BaseGuildTextChannel;

    // TODO: log to database

    if (!logsChannel) {
      client.logger.info(`No logs channel configured for ${message.guild.name}`);
      return;
    }

    const embed = new MessageEmbed()
      .setColor('#ff0000')
      .setAuthor({
        name: message.author.tag,
        iconURL: message.author.displayAvatarURL()
      })
      .setDescription(`Mensaje de <@${message.author.id}> eliminado en <#${message.channel.id}>`);

    if (message.content.length) {
      embed.addField('Mensaje', message.content.length > 1024 ? `${message.content.slice(0, 1021)}...` : message.content, false);
    }

    if (message.attachments.size) {
      embed.addField('Archivos', message.attachments.map(file => file.url).join('\n'), false);
    }

    const previousMessages = await message.channel.messages.fetch({ limit: 10, before: message.id }),
      previousMessagesNotAuthor = previousMessages.filter(msg => msg.author.id !== message.author.id),
      previousMessage = previousMessagesNotAuthor.size ? previousMessagesNotAuthor.first() : previousMessages.first();

    embed.addField('Mensaje anterior', `[Ver mensaje](${previousMessage!.url})`);

    await logsChannel.send({
      embeds: [embed]
    });
  }
}

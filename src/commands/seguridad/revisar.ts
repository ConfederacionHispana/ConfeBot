import { Command } from 'discord-akairo';
import { Message, MessageEmbed } from 'discord.js';
// @ts-ignore
import { getColorFromURL } from 'color-thief-node';
import { env, loadEnv } from '../../environment';
import FandomUtilities from '../../packages/seguridad/FandomUtilities';
import Vigilancia from '../../packages/seguridad/Vigilancia';

loadEnv();

class RevisarCommand extends Command {
  constructor() {
    super('revisar', {
      aliases: ['revisar'],
      args: [
        {
          id: 'qty',
          type: 'number'
        }
      ]
    });
  }

  async exec(message: Message, { qty }: { qty?: number }): Promise<void> {
    const memberHasRole = message.member?.roles.cache.has(env.SEGURIDAD_ROLE);
    if (!memberHasRole) return;

    await message.react('✅');

    const sample = await Vigilancia.sample(qty);
    const embed = await RevisarCommand.userCustomEmbed(message);

    for (const item of sample) {
      const url = FandomUtilities.interwiki2url(item.interwiki);
      let fieldValue = `**Enlace:** ${url}\n`;
      fieldValue = `**Último patrullaje:** ${item.ago}.\n`;
      fieldValue = `**Editores encontrados:** ${item.users.join(', ')}`;
      if (fieldValue.length > 1000) fieldValue = `${fieldValue.substr(0, 1000)}...`;

      embed.addField(
        item.sitename,
        fieldValue
      );
    }

    message.channel.send(embed);
  }

  static async userCustomEmbed(message: Message): Promise<MessageEmbed> {
    const avatarURL = message.author.avatarURL({ format: 'png' }) || undefined;
    const colorRGB: number[] = await getColorFromURL(avatarURL);
    const colorHex = colorRGB.map((i) => i.toString(16)).join('');
    const color = parseInt(colorHex, 16);
    const embed = new MessageEmbed({
      title: message.author.tag,
      color,
      thumbnail: {
        url: avatarURL
      }
    });

    return embed;
  }
}

export default RevisarCommand;

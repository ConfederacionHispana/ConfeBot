import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { env } from '../../environment';
import FandomUtilities from '../../util/FandomUtilities';
import Vigilancia from '../../modules/seguridad/Vigilancia';

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
    const avatarURL = message.author.avatarURL({ format: 'png' }) || undefined;
    const embed = await Vigilancia.customUserEmbed(message.author.tag, avatarURL);

    for (const item of sample) {
      const url = FandomUtilities.interwiki2url(item.interwiki);
      let fieldValue = `**Enlace:** ${url}\n`;
      fieldValue += `**Último patrullaje:** ${item.ago}.\n`;
      fieldValue += `**Editores encontrados:** ${item.users.join(', ')}`;
      if (fieldValue.length > 1000) fieldValue = `${fieldValue.substr(0, 1000)}...`;

      embed.addField(
        item.sitename,
        fieldValue
      );
    }

    message.channel.send(embed);
  }
}

export default RevisarCommand;

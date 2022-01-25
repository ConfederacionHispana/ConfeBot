import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { env, FandomUtilities, Vigilancia } from '@confebot/lib';

import type { CommandOptions } from '@sapphire/framework';
import type { Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
  aliases: ['revisar']
})
export class SecurityReviewCommand extends Command {
  public async messageRun(message: Message, args: Args): Promise<void> {
    const memberHasRole = message.member?.roles.cache.has(env.SEGURIDAD_ROLE);
    if (!memberHasRole) return;

    const { client } = this.container;

    const { value: qty } = await args.pickResult('number');

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

      embed.addField(item.sitename, fieldValue);
    }

    message.channel
      .send({
        embeds: [embed]
      })
      .catch(client.logException);
  }
}

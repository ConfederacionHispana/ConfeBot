import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, CommandOptions, UserError } from '@sapphire/framework';
import { MessageAttachment, TextChannel, type Message } from 'discord.js';
import { connect } from 'puppeteer-core';
import { URL } from 'url';
import { env } from '#lib/env';

@ApplyOptions<CommandOptions>({
  aliases: ['arrest', 'arrestar']
})
export class ArrestCommand extends Command {
  public async messageRun(message: Message, args: Args): Promise<void> {
    const { client } = this.container;

    if (!env.CHROMIUM_URI) {
      await message.reply({
        embeds: [
          {
            color: 14889515,
            description: `❌ No se puede ejecutar este comando porque no se ha configurado una instancia de Chromium.`
          }
        ]
      });
      return;
    }

    try {
      const member = await args.pick('member'),
        reason = await args.rest('string');

      const reaction = await message.react('⌛');

      const browser = await connect({
        browserWSEndpoint: env.CHROMIUM_URI,
        defaultViewport: {
          width: 1024,
          height: 576
        }
      });

      const page = await browser.newPage();
      const templateURL = new URL(`${env.TEMPLATE_BASE_URL}/arrest`);
      templateURL.searchParams.append('user', member.displayName);
      templateURL.searchParams.append('nameColor', member.displayHexColor.replace('#', ''));
      templateURL.searchParams.append('channel', (message.channel as TextChannel).name);
      templateURL.searchParams.append('role', member.roles.hoist?.name ?? member.roles.highest.name);
      templateURL.searchParams.append('reason', reason);
      templateURL.searchParams.append('avatar', member.user.displayAvatarURL({ format: 'png', size: 512 }));
      templateURL.searchParams.append('tag', member.user.tag);

      await page.goto(templateURL.href);

      const screenshot = await page.screenshot({
        type: 'png'
      });

      const file = new MessageAttachment(screenshot, 'arrest.png');

      await message.reply({
        files: [file]
      });

      await reaction.remove();

      await browser.disconnect();
    } catch (err) {
      if (err instanceof UserError) {
        await message.reply('❌ debes indicar un usuario y una razón.');
      } else client.logException(err);
    }
  }
}

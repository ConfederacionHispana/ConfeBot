import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, CommandOptions } from '@sapphire/framework';
import { Canvas, FontLibrary, loadImage } from 'skia-canvas';
import { resolve } from 'path';

import { MessageAttachment, TextChannel, type Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
  aliases: ['arrest', 'arrestar']
})
export class ArrestCommand extends Command {
  public async messageRun(message: Message, args: Args): Promise<void> {
    const member = await args.pick('member'),
      reason = await args.rest('string');

    // TODO: move this to a service
    FontLibrary.use([
      resolve(__dirname, '../../../assets/fonts/segoe-ui/Segoe UI.ttf'),
      resolve(__dirname, '../../../assets/fonts/segoe-ui/Segoe UI Bold.ttf'),
      resolve(__dirname, '../../../assets/fonts/segoe-ui/Segoe UI Italic.ttf'),
      resolve(__dirname, '../../../assets/fonts/segoe-ui/Segoe UI Bold Italic.ttf')
    ]);

    const canvas = new Canvas(1600, 900),
      ctx = canvas.getContext('2d');

    const template = await loadImage(resolve(__dirname, '../../../assets/image-templates/arrest.png')),
      avatar = await loadImage(member.user.displayAvatarURL({ format: 'png', size: 512 }));

    ctx.drawImage(avatar, 1020, 160, 440, 440);
    ctx.drawImage(template, 0, 0);

    ctx.font = 'bold 40px Segoe UI';

    ctx.fillStyle = member.displayHexColor;
    ctx.fillText(member.displayName, 282, 328);

    ctx.fillStyle = '#000';
    ctx.fillText((message.channel as TextChannel).name, 290, 422);
    ctx.fillText('Confederación Hispana', 320, 518);
    ctx.fillText('Usuario', 220, 620);

    ctx.textWrap = true;
    ctx.fillText(reason, 350, 710, 340);
    ctx.textWrap = false;

    ctx.font = 'bold 48px Segoe UI';
    ctx.fillText(member.user.tag, 1016, 803, 450);

    const file = new MessageAttachment(await canvas.toBuffer('png'), 'arrest.png');

    await message.channel.send({
      files: [file]
    });
  }
}

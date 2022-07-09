import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, Args, Command, CommandOptions } from '@sapphire/framework';
import { CommandInteraction, GuildMember, MessageAttachment, ReplyMessageOptions, type Message } from 'discord.js';
import { connect } from 'puppeteer-core';
import { URL } from 'url';
import { env } from '../../lib/env';

@ApplyOptions<CommandOptions>({
  aliases: ['arrest'],
  description: 'Arresta a un usuario',
  name: 'arrestar'
})
export class ArrestCommand extends Command {
  public override async registerApplicationCommands(registry: ApplicationCommandRegistry): Promise<void> {
    registry.registerChatInputCommand(
      builder => builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption(option => option
          .setName('usuario')
          .setDescription('Usuario a arrestar')
          .setRequired(true))
        .addStringOption(option => option
          .setName('motivo')
          .setDescription('Motivo del arresto')
          .setRequired(true)),
      await this.container.stores.get('models').get('command').getData(this.name)
    );
  }

  public async evaluate({ member, place, reason }: { member: GuildMember, place: string, reason: string }): Promise<ReplyMessageOptions> {
    if (!env.CHROMIUM_URI) {
      return {
        embeds: [
          {
            color: 14889515,
            description: `❌ No se puede ejecutar este comando porque no se ha configurado una instancia de Chromium.`
          }
        ]
      };
    }

    try {
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
      templateURL.searchParams.append('channel', place);
      templateURL.searchParams.append('role', member.roles.hoist?.name ?? member.roles.highest.name);
      templateURL.searchParams.append('reason', reason);
      templateURL.searchParams.append('avatar', member.user.displayAvatarURL({ format: 'png', size: 512 }));
      templateURL.searchParams.append('tag', member.user.tag);

      await page.goto(templateURL.href);

      const screenshot = await page.screenshot({
        type: 'png'
      });

      const file = new MessageAttachment(screenshot, 'arrest.png');
      await browser.disconnect();

      return {
        files: [file]
      };
    } catch (err) {
      this.container.client.logException(err);
      return {
        content: 'Ha ocurrido un error inesperado.'
      };
    }
  }

  public async messageRun(message: Message, args: Args): Promise<void> {
    const reaction = await message.react('⌛');
    if (!('name' in message.channel)) return;
    const member = await args.pick('member')
      .catch(() => null);

    if (!member) {
      void message.reply(`Debes de especificar primero a algún usuario.`);
      return;
    }

    const reason = await args.rest('string')
      .catch(() => null);
    if (!reason || reason.length === 0) {
      void message.reply(`Debes de especificar un motivo para el arresto.`);
      return;
    }

    const reply = await this.evaluate({
      member,
      place: message.channel.name,
      reason
    });
    void message.reply(reply)
      .catch(e => this.container.client.logException(e));
    void reaction.remove();
  }

  public async chatInputRun(interaction: CommandInteraction<'cached' | 'raw'>): Promise<void> {
    const user = interaction.options.getUser('usuario', true);
    const reason = interaction.options.getString('motivo', true);
    const guild = interaction.guild ?? await this.container.client.guilds.fetch(interaction.guildId);
    const member = await guild.members.fetch(user.id)
      .catch(() => null);
    if (!member) {
      void interaction.editReply(`El usuario no se encuentra en el servidor.`);
      return;
    }
    const channel = interaction.channel ?? await guild.channels.fetch(interaction.channelId);

    await interaction.deferReply();

    const reply = await this.evaluate({
      member,
      place: channel?.name ?? 'Un lugar desconocido',
      reason
    });

    await interaction.editReply(reply);
  }
}

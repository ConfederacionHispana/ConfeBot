import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, Command, CommandOptions } from '@sapphire/framework';
import { ChannelType } from 'discord-api-types/v9';
import { CommandInteraction, MessageActionRowOptions, MessageButtonOptions, MessageEmbed, NewsChannel, NonThreadGuildBasedChannel, Permissions, TextChannel, Webhook } from 'discord.js';
import { chunkify, getInteractionChannel, getInteractionGuild } from '../../lib';
import type { IRole } from '../../models/Role';

@ApplyOptions<CommandOptions>({
  description: 'Configura un mensaje con botones para roles',
  name: 'roles'
})
export class RolesCommand extends Command {
  public override async registerApplicationCommands(registry: ApplicationCommandRegistry): Promise<void> {
    registry.registerChatInputCommand(
      builder => builder
        .setName(this.name)
        .setDescription(this.description)
        .setDefaultMemberPermissions(Permissions.FLAGS.MANAGE_GUILD)
        .addSubcommand(input => input
          .setName('canal')
          .setDescription('Especifica el canal a configurar.')
          .addChannelOption(option => option
            .setName('canal')
            .setDescription('Mención del canal')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildNews, ChannelType.GuildText)))
        .addSubcommand(input => input
          .setName('mensaje')
          .setDescription('Especifica el mensaje a configurar.')
          .addStringOption(option => option
            .setName('mensaje')
            .setDescription('Identificador del mensaje')
            .setRequired(true)))
        .addSubcommand(input => input
          .setName('copiar-mensaje')
          .setDescription('Copia un mensaje del canal actual para usarlo en el canal especificado.')
          .addStringOption(option => option
            .setName('mensaje')
            .setDescription('Identificador del mensaje')
            .setRequired(true)))
        .addSubcommand(input => input
          .setName('editar-mensaje')
          .setDescription('Edita el mensaje usando un mensaje del canal actual.')
          .addStringOption(option => option
            .setName('mensaje')
            .setDescription('Identificador del mensaje')
            .setRequired(true)))
        .addSubcommand(input => input
          .setName('agregar-rol')
          .setDescription('Añade el botón para un rol.')
          .addRoleOption(option => option
            .setName('rol')
            .setDescription('Rol a colocar')
            .setRequired(true))
          .addStringOption(option => option
            .setName('etiqueta')
            .setDescription('Texto del botón'))
          .addStringOption(option => option
            .setName('emoji')
            .setDescription('Emoji del botón')))
        .addSubcommand(input => input
          .setName('eliminar-rol')
          .setDescription('Elimina el botón para un rol.')
          .addRoleOption(option => option
            .setName('rol')
            .setDescription('Rol a quitar')
            .setRequired(true))),
      await this.container.stores.get('models').get('command').getData(this.name)
    );
  }

  public async chatInputRun(interaction: CommandInteraction<'cached' | 'raw'>): Promise<void> {
    await interaction.deferReply();

    const subcommand = interaction.options.getSubcommand();
    const keyv = this.container.stores.get('models').get('keyv');

    if (subcommand === 'canal') {
      await this.setChannel(interaction);
      return;
    }
    const guild = this.container.stores.get('models').get('guild');
    const channel = await guild.getChannel(interaction.guildId, 'roles');
    if (!channel) {
      await interaction.editReply({
        embeds: [{
          color: 0xff6f00,
          description: 'Necesitas especificar un canal usando `/roles canal`.'
        }]
      });
      return;
    }


    if (subcommand === 'mensaje') {
      await this.setMessage(interaction);
    } else if (subcommand === 'copiar-mensaje') {
      await this.copyMessage(interaction);
    } else if (subcommand === 'editar-mensaje' || subcommand === 'agregar-rol' || subcommand === 'eliminar-rol') {
      const messageId = await keyv.get(interaction.guildId, 'roles-message');
      if (!messageId) {
        const embed = new MessageEmbed({
          color: 0xff6f00,
          description: 'Necesitas especificar un mensaje usando `/roles mensaje`.'
        });
        await interaction.editReply({
          embeds: [embed]
        });
        return;
      }

      if (subcommand === 'editar-mensaje') {
        await this.copyMessage(interaction, messageId);
      } else if (subcommand === 'agregar-rol') {
        await this.setRole(interaction, messageId);
      } else {
        await this.unsetRole(interaction, messageId);
      }
    } else {
      await interaction.editReply('No reconozco el comando que has utilizado.');
    }
  }

  private async setChannel(interaction: CommandInteraction<'cached' | 'raw'>): Promise<void> {
    const channel = interaction.options.getChannel('canal', true);
    const guild = this.container.stores.get('models').get('guild');
    await guild.setChannel(interaction.guildId, 'roles', channel.id);
    await interaction.editReply({
      embeds: [{
        color: 0x1b5e20,
        description: `Se ha configurado el canal exitosamente: <#${ channel.id }>`
      }]
    });
  }

  private async setMessage(interaction: CommandInteraction<'cached' | 'raw'>): Promise<void> {
    const messageId = interaction.options.getString('mensaje', true);
    const guild = await getInteractionGuild(interaction);

    const keyv = this.container.stores.get('models').get('keyv');
    const dbGuild = this.container.stores.get('models').get('guild');
    const channelId = await dbGuild.getChannel(interaction.guildId, 'roles');
    const channel = channelId
      ? await guild.channels.fetch(channelId).catch(() => null)
      : null;
    if (!this.isValidChannel(interaction, channel)) return;

    const message = await channel.messages.fetch(messageId)
      .catch(() => null);

    if (!message) {
      await interaction.editReply({
        embeds: [{
          color: 0xb71c1c,
          description: 'No he podido encontrar el mensaje especificado. Asegúrate de que no haya sido borrado y que tenga acceso a los mensajes del canal.'
        }]
      });
      return;
    }

    const webhook = await message.fetchWebhook()
      .catch(() => null);
    const isOwnedWebhook = webhook?.owner?.id && webhook.owner.id === this.container.client.user?.id;

    if (!isOwnedWebhook) {
      await interaction.editReply({
        embeds: [{
          color: 0xb71c1c,
          description: 'Este mensaje no fue enviado por el bot, por lo que no es posible editarlo.\nPuedes copiarlo y re-enviarlo usando `/roles copiar-mensaje`.'
        }]
      });
      return;
    }

    await keyv.set(interaction.guildId, 'roles-message', message.id);
    await interaction.editReply({
      embeds: [{
        color: 0x1b5e20,
        description: 'Se ha configurado el mensaje exitosamente.'
      }]
    });
  }

  private async copyMessage(interaction: CommandInteraction<'cached' | 'raw'>, messageToEdit?: string): Promise<void> {
    const messageId = interaction.options.getString('mensaje', true);
    const currentChannel = await getInteractionChannel(interaction);
    if (!currentChannel) return;
    const message = await currentChannel.messages.fetch(messageId)
      .catch(() => null);
    if (!message) {
      await interaction.editReply({
        embeds: [{
          color: 0xb71c1c,
          description: 'No he podido encontrar el mensaje proporcionado. Asegúrate de que no haya sido borrado y estés usando el comando en el mismo canal donde está el mensaje.'
        }]
      });
      return;
    }

    const keyv = this.container.stores.get('models').get('keyv');
    const guild = await getInteractionGuild(interaction);

    const dbGuild = this.container.stores.get('models').get('guild');
    const rolesChannelId = await dbGuild.getChannel(interaction.guildId, 'roles');
    const rolesChannel = rolesChannelId
      ? await guild.channels.fetch(rolesChannelId).catch(() => null)
      : null;
    if (!this.isValidChannel(interaction, rolesChannel)) return;

    let webhook: Webhook | null = null;
    if (messageToEdit) {
      const existingMessage = await rolesChannel.messages.fetch(messageToEdit)
        .catch(() => null);
      if (!existingMessage) {
        await interaction.editReply({
          embeds: [{
            color: 0xb71c1c,
            description: 'No he podido encontrar el mensaje a editar. Asegúrate de que no haya sido borrado y que tenga acceso a los mensajes del canal.'
          }]
        });
        return;
      }
      webhook = await existingMessage.fetchWebhook();
    }
    if (!webhook) {
      const webhooks = await rolesChannel.fetchWebhooks();
      webhook = webhooks.find(i => (i.owner && i.owner.id === this.container.client.user?.id) ?? false) ?? await rolesChannel.createWebhook(this.container.client.user?.username ?? 'Confe-bot', {
        avatar: this.container.client.user?.avatarURL({ format: 'png' }) ?? ''
      });
    }

    const webhookMessageOptions = {
      content: message.content.length === 0 ? null : message.content,
      embeds: message.embeds
    };
    const webhookMessage = messageToEdit
      ? await webhook.editMessage(messageToEdit, webhookMessageOptions)
      : await webhook.send(webhookMessageOptions);

    if (!messageToEdit) {
      const roleMessages = this.container.stores.get('models').get('role-message');
      await roleMessages.create({
        channel: rolesChannel.id,
        guild: interaction.guildId,
        message: webhookMessage.id
      });
      await keyv.set(interaction.guildId, 'roles-message', webhookMessage.id);
    }

    await interaction.editReply({
      embeds: [{
        color: 0x1b5e20,
        description: `Se ha ${ messageToEdit ? 'editado' : 'enviado' } el mensaje exitosamente. Ahora puedes añadir botones para roles en él.`
      }]
    });
  }

  private async setRole(interaction: CommandInteraction<'cached' | 'raw'>, messageId: string): Promise<void> {
    const role = interaction.options.getRole('rol', true);
    const label = interaction.options.getString('etiqueta');
    const emoji = interaction.options.getString('emoji');

    if (role.position === 0 || role.managed) {
      await interaction.editReply({
        embeds: [{
          color: 0xb71c1c,
          description: `<@&${ role.id }> es un rol que pertenece a un bot o @everyone, y no puede ser asignado.`
        }]
      });
      return;
    }

    const roles = this.container.stores.get('models').get('role');
    const buttonsCount = await roles.countRolesInMessage(messageId);
    if (buttonsCount >= 25) {
      await interaction.editReply({
        embeds: [{
          color: 0xb71c1c,
          description: 'Solo puede haber un máximo de 25 botones por mensaje.'
        }]
      });
      return;
    }

    const alreadyExists = await roles.isSet(messageId, role.id);
    if (alreadyExists) {
      await interaction.editReply({
        embeds: [{
          color: 0xb71c1c,
          description: `Solo puede haber un botón por rol, y parece que <@&${ role.id }> ya está configurado en el mensaje actual.`
        }]
      });
      return;
    }

    if (!label && !emoji) {
      await interaction.editReply({
        embeds: [{
          color: 0xb71c1c,
          description: 'Debes de especificar un valor al menos para la etiqueta o el emoji.'
        }]
      });
      return;
    }

    const data: IRole = {
      creation: new Date(),
      message: messageId,
      role: role.id
    };
    if (label) data.label = label;
    if (emoji) {
      const customEmoji = emoji.match(/<.*?:([0-9]+)>/)?.[ 1 ];
      if (customEmoji) {
        data.emoji = customEmoji;
      } else {
        data.emoji = emoji;
      }
    }

    await roles.create(data);
    await this.updateButtons(interaction, messageId);

    await interaction.editReply({
      embeds: [{
        color: role.color,
        description: `Se ha añadido un botón para <@&${ role.id }>.`
      }]
    });
  }

  private async unsetRole(interaction: CommandInteraction<'cached' | 'raw'>, messageId: string): Promise<void> {
    const role = interaction.options.getRole('rol', true);

    const roles = this.container.stores.get('models').get('role');
    const records = await roles.getMessageRoles(messageId);
    const exists = records.find(r => r.role === role.id);
    if (!exists) {
      await interaction.editReply({
        embeds: [{
          color: 0xb71c1c,
          description: `El rol <@&${ role.id }> no se encontraba configurado en el mensaje actual.`
        }]
      });
      return;
    }

    await roles.delete(messageId, role.id);
    await this.updateButtons(interaction, messageId);

    await interaction.editReply({
      embeds: [{
        color: role.color,
        description: `Se ha eliminado el botón para <@&${ role.id }>.`
      }]
    });
  }

  private isValidChannel(interaction: CommandInteraction<'cached' | 'raw'>, channel: NonThreadGuildBasedChannel | null | undefined): channel is NewsChannel | TextChannel {
    if (!channel) {
      void interaction.editReply({
        embeds: [{
          color: 0xb71c1c,
          description: 'No he podido encontrar el canal configurado, es posible que haya sido borrado.'
        }]
      });
      return false;
    } else if (channel.type !== 'GUILD_NEWS' && channel.type !== 'GUILD_TEXT') {
      void interaction.editReply({
        embeds: [{
          color: 0xb71c1c,
          description: `No puedo usar <#${ channel.id }> porque no es un canal de texto o de noticias.`
        }]
      });
      return false;
    }
    return true;
  }

  private getComponents(roles: IRole[]): Array<MessageActionRowOptions & { type: 'ACTION_ROW' }> {
    const rawButtons: MessageButtonOptions[] = [];
    for (const role of roles) {
      const button: MessageButtonOptions = {
        customId: `role-${ role.role }`,
        style: 'SECONDARY',
        type: 'BUTTON'
      };
      if (role.label) button.label = role.label;
      if (role.emoji) button.emoji = role.emoji;
      rawButtons.push(button);
    }
    const buttons = chunkify(rawButtons, 5).map(chunk => ({
      components: chunk,
      type: 'ACTION_ROW'
    } as MessageActionRowOptions & { type: 'ACTION_ROW' }));
    return buttons;
  }

  private async updateButtons(interaction: CommandInteraction<'cached' | 'raw'>, messageId: string): Promise<void> {
    const guild = await getInteractionGuild(interaction);
    const roleMessages = this.container.stores.get('models').get('role-message');
    const channelId = (await roleMessages.get(messageId))?.channel;
    const channel = channelId
      ? await guild.channels.fetch(channelId)
        .catch(() => null)
      : null;

    if (!this.isValidChannel(interaction, channel)) return;
    const message = await channel.messages.fetch(messageId)
      .catch(() => null);
    if (!message) return;

    const webhook = await message.fetchWebhook();
    const roles = this.container.stores.get('models').get('role');
    const messageRoles = await roles.getMessageRoles(messageId);

    const components = this.getComponents(messageRoles);
    await webhook.editMessage(messageId, {
      components
    });
  }
}

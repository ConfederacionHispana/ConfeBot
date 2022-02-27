import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, container } from '@sapphire/framework';
import { URL } from 'url';
import { format as formatDate } from 'date-fns';
import { env, UserVerification } from '../../lib';

import type { CommandOptions } from '@sapphire/framework';
import type { CommandInteraction, Guild, GuildMember, Message, ReplyMessageOptions, TextChannel } from 'discord.js';

@ApplyOptions<CommandOptions>({
  aliases: ['verify'],
  chatInputApplicationOptions: {
    description: 'Verifícate usando tu cuenta de Fandom',
    guildIds: container.client.applicationCommandsGuilds,
    name: 'verificar',
    options: [
      {
        description: 'Nombre de usuario en Fandom',
        name: 'usuario',
        required: true,
        type: 'STRING'
      }
    ]
  },
  name: 'verificar',
  runIn: 'GUILD_ANY'
})
export class UserVerifyCommand extends Command {
  public async evaluate(guild: Guild, channel: string, member: GuildMember, username: string): Promise<ReplyMessageOptions | string> {
    const model = this.container.stores.get('models').get('user');
    const dbUser = await model.findUserBySnowflake(member.user.id);

    // TODO: Allow users to re-verify (e.g. if they changed accs)?
    if (member.roles.cache.has(env.FDUSER_ROLE) && dbUser?.fandomUser) {
      return {
        embeds: [
          {
            color: 4575254,
            title: 'Ya te has verificado',
            description: `✅ Ya has verificado tu cuenta de Fandom: **${dbUser.fandomUser.username}**\n\nSi quieres cambiar o desconectar tu cuenta, contacta con el <@&${env.STAFF_ROLE}> del servidor.`
          }
        ]
      };
    }

    const logsChannel = await guild.channels.fetch(env.LOGS_CHANNEL) as TextChannel;

    const interactiveVerifyURL = new URL('https://confederacion-hispana.fandom.com/es/wiki/Especial:VerifyUser');

    interactiveVerifyURL.searchParams.append('useskin', 'fandomdesktop');
    interactiveVerifyURL.searchParams.append('user', member.user.username);
    interactiveVerifyURL.searchParams.append('tag', member.user.discriminator);
    interactiveVerifyURL.searchParams.append('ch', channel);
    interactiveVerifyURL.searchParams.append('c', 'c!verify');

    const { client } = this.container;
    const verificationResult = await UserVerification.verifyUser(username, member.user.username, member.user.discriminator);
    if (verificationResult.success) {
      const dbUser = await model.findUserBySnowflake(member.user.id) ?? model.getDefaultUser(member.user.id);

      dbUser.fandomUser = {
        username: verificationResult.user!.name,
        userId: verificationResult.user!.id,
        verifiedAt: new Date()
      };

      dbUser.fandomAccountEvents = dbUser.fandomAccountEvents.concat({
        date: new Date(),
        event: 'userVerify',
        account: {
          username: verificationResult.user!.name,
          userId: verificationResult.user!.id
        }
      });

      return Promise.all([
        model.create(dbUser),
        member.roles.add([env.USER_ROLE, env.FDUSER_ROLE], `Verificado como ${username}`),
        member.roles.remove(env.NEWUSER_ROLE),
        logsChannel.send(`✅ Se verificó a <@!${member.user.id}> con la cuenta de Fandom **${username}**`)
      ])
        .then(() => ({
          embeds: [
            {
              color: 4575254,
              title: '¡Verificación completada!',
              description: `✅ Te has autenticado correctamente con la cuenta de Fandom **${username}** y ahora tienes acceso a todos los canales del servidor.\n\n¡Recuerda visitar <#${env.SELFROLES_CHANNEL}> si deseas elegir más roles de tu interés!`
            }
          ]
        }))
        .catch(e => {
          client.logException(e);
          return `Ha ocurrido un error durante la verificación.`;
        });
    }

    const embed = {
      color: 14889515,
      description: `❌ No es posible completar tu verificación por la siguiente razón:\n${verificationResult.errorDescription}`,
      fields: [
        {
          name: '¿Tienes algún inconveniente para completar la verificación?',
          value: `Menciona a algún miembro del <@&${env.STAFF_ROLE}> e intentaremos ayudarte.`
        }
      ]
    };
    interactiveVerifyURL.pathname += `/${username}`;

    if (verificationResult.error === 'Blocked') {
      embed.description += `\n\nEl bloqueo fue efectuado por ${verificationResult.blockinfo?.performer}${
        verificationResult.blockinfo?.reason ? ` con la razón _${verificationResult.blockinfo.reason}_` : ''
      }, y expira ${
        verificationResult.blockinfo?.expiry === Infinity
          ? '**nunca**'
          : `el ${formatDate(verificationResult.blockinfo?.expiry as Date, 'dd/MM/yyyy')}`
      }.`;

      void logsChannel
        .send(
          `⚠️ <@!${member.user.id}> intentó autenticarse con la cuenta de Fandom bloqueada **${username}**.`
        );
    } else if (verificationResult.error === 'DiscordHandleNotFound' || verificationResult.error === 'DiscordHandleMismatch') {
      embed.description += `\n\nPuedes dirigirte a [este enlace](${interactiveVerifyURL.href}) para añadir o actualizar tu tag, luego intenta verificarte nuevamente.`;
    }

    return {
      embeds: [embed]
    };
  }

  public async messageRun(message: Message, args: Args): Promise<void> {
    if (!message.guild || !('name' in message.channel) || !message.member) return;
    const fandomUserResolver = Args.make((arg) => Args.ok(arg.substring(0, 255)));
    const fandomUser = await args.restResult(fandomUserResolver);

    if (!fandomUser.success) {
      void message.reply('❌ Debes ingresar tu nombre de usuario de Fandom.');
      return;
    }

    const reply = await this.evaluate(message.guild, message.channel.name, message.member, fandomUser.value);
    void message.reply(reply);
  }

  public async chatInputApplicationRun(interaction: CommandInteraction<'present'>): Promise<void> {
    await interaction.deferReply();
    const username = interaction.options.getString('usuario', true);

    const guild = interaction.guild ?? await this.container.client.guilds.fetch(interaction.guildId);
    const member = await guild.members.fetch(interaction.user.id)
      .catch(() => null);

    if (!member) {
      // imagine this actually happening, lol
      void interaction.editReply(`El usuario no se encuentra en el servidor.`);
      return;
    }

    const reply = await this.evaluate(guild, interaction.channel?.name ?? 'desconocido', member, username);
    void interaction.editReply(reply);
  }
}

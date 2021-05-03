import { URL } from 'url';
import { Command } from 'discord-akairo';
import { Message, TextChannel } from 'discord.js';
import { format as formatDate } from 'date-fns';

import { env } from '../../environment';
import DBModels from '../../db';
import UserVerification from '../../modules/confe/UserVerification';
import NonExistentUser from '../../util/errors/NonExistentUser';

class UserVerifyCommand extends Command {
  constructor() {
    super('verify', {
      aliases: ['verify'],
      args: [
        {
          id: 'fandomUser',
          match: 'content',
          type: 'string'
        }
      ]
    });
  }

  async exec(msg: Message, args: { fandomUser: string }): Promise<void> {
    if (msg.channel.id !== env.VERIF_CHANNEL) return;
    if (msg.author.bot) return;
    if (!msg.guild || !msg.member) return;

    // TODO: Allow users to re-verify (e.g. if they changed accs)?
    if (msg.member.roles.cache.has(env.USER_ROLE)) return;

    if (!args.fandomUser) {
      msg.reply('❌ Debes ingresar tu nombre de usuario de Fandom.');
      return;
    }

    const fandomUser = args.fandomUser.substring(0, 255);
    const { guild, member } = msg;
    const logsChannel = guild.channels.resolve(env.LOGS_CHANNEL) as TextChannel;
    const discordTag = `${msg.author.username}#${msg.author.discriminator}`;

    const interactiveVerifyURL = new URL('https://confederacion-hispana.fandom.com/es/wiki/Especial:VerifyUser');
    interactiveVerifyURL.searchParams.append('user', msg.author.username);
    interactiveVerifyURL.searchParams.append('tag', msg.author.discriminator);
    interactiveVerifyURL.searchParams.append('ch', (msg.channel as TextChannel).name);
    interactiveVerifyURL.searchParams.append('c', 'c!verify');

    UserVerification.verifyUser(fandomUser, msg.author.username, msg.author.discriminator).then((result) => {
      if (result.success) {
        member.roles.add([env.USER_ROLE, env.FDUSER_ROLE], `Verificado como ${fandomUser}`).then(async () => {
          member.roles.remove(env.NEWUSER_ROLE).catch(this.client.logException);
          logsChannel.send(`✅ Se verificó a <@!${msg.author.id}> con la cuenta de Fandom **${fandomUser}**`).catch(this.client.logException);
          msg.channel.send({
            embed: {
              color: 4575254,
              title: '¡Verificación completada!',
              description: `✅ Te has autenticado correctamente con la cuenta de Fandom **${fandomUser}** y ahora tienes acceso a todos los canales del servidor.\n\n¡Recuerda visitar <#${env.SELFROLES_CHANNEL}> si deseas elegir más roles de tu interés!`
            }
          }).catch(this.client.logException);

          const dbUser = await DBModels.User.findOne({ id: msg.author.id }) || new DBModels.User({ id: msg.author.id });

          dbUser.fandomUser = {
            username: result.user!.name,
            userId: result.user!.id,
            verifiedAt: new Date()
          };

          dbUser.fandomAccountEvents = dbUser.fandomAccountEvents.concat({
            date: new Date(),
            event: 'userVerify',
            account: {
              username: result.user!.name,
              userId: result.user!.id
            }
          });

          dbUser.save().catch(this.client.logException);
        }).catch(this.client.logException);
      } else {
        const embed = {
          color: 14889515,
          description: `❌ No es posible completar tu verificación por la siguiente razón:\n${result.errorDescription}`,
          fields: [
            {
              name: '¿Tienes algún inconveniente para completar la verificación?',
              value: `Menciona a algún miembro del <@&${env.STAFF_ROLE}> e intentaremos ayudarte.`
            }
          ]
        };

        interactiveVerifyURL.pathname += `/${fandomUser}`;

        if (result.error === 'Blocked') {
          embed.description += `\n\nEl bloqueo fue efectuado por ${result.blockinfo?.performer}${result.blockinfo?.reason ? ` con la razón _${result.blockinfo.reason}_` : ''}, y expira ${(result.blockinfo?.expiry === Infinity) ? '**nunca**' : `el ${formatDate(result.blockinfo?.expiry as Date, 'dd/MM/yyyy')}`}.`;
          logsChannel.send(`⚠️ <@!${msg.author.id}> intentó autenticarse con la cuenta de Fandom bloqueada **${fandomUser}**.`).catch(this.client.logException);
        }

        if (result.error === 'DiscordHandleNotFound' || result.error === 'DiscordHandleMismatch') embed.description += `\n\nPuedes dirigirte a [este enlace](${interactiveVerifyURL.href}) para añadir o actualizar tu tag, luego intenta verificarte nuevamente.`;

        if (result.error === 'DiscordHandleMismatch') {
          this.client.logger.info('Usuario inició la verificación, discordHandle no coincide', {
            discordTag,
            fandomUser
          });
        }

        msg.channel.send({ embed }).catch(this.client.logException);
      }
    }).catch((err) => {
      if (err instanceof NonExistentUser) {
        this.client.logger.info('Usuario inició la verificación, usuario de Fandom no existe', {
          discordTag,
          fandomUser
        });

        msg.channel.send({
          embed: {
            color: 14889515,
            description: `❌ No es posible completar tu verificación porque la cuenta de Fandom que has indicado (${fandomUser}) no existe o está deshabilitada.\n\nVerifica que tu nombre de usuario sea el correcto, e inténtalo nuevamente.`,
            fields: [
              {
                name: '¿Tienes algún inconveniente para completar la verificación?',
                value: `Menciona a algún miembro del <@&${env.STAFF_ROLE}> e intentaremos ayudarte.`
              }
            ]
          }
        }).catch(this.client.logException);
      } else {
        this.client.logException(err);
        msg.channel.send({
          embed: {
            color: 14889515,
            description: `❌ Ocurrió un error interno. Por favor intenta nuevamente.\n\nSi sigues recibiendo este mensaje, probablemente esto sea un bug. Menciona a un miembro del <@&${env.STAFF_ROLE}> e intentaremos ayudarte.`
          }
        }).catch(this.client.logException);
      }
    });
  }
}

export default UserVerifyCommand;

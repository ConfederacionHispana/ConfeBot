import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { URL } from 'url';
import { format as formatDate } from 'date-fns';
import { env, NonExistentUser, UserVerification } from '../../lib';

import type { CommandOptions } from '@sapphire/framework';
import type { Message, TextChannel } from 'discord.js';

@ApplyOptions<CommandOptions>({
  aliases: ['verify']
})
export class UserVerifyCommand extends Command {
  public async messageRun(message: Message, args: Args): Promise<void> {
    const { client } = this.container;
    if (message.channel.id !== env.VERIF_CHANNEL) return;
    if (message.author.bot) return;
    if (!message.guild || !message.member) return;

    const model = this.container.stores.get('models').get('user')
    const dbUser = await model.findUserBySnowflake(message.author.id)

    // TODO: Allow users to re-verify (e.g. if they changed accs)?
    if (message.member.roles.cache.has(env.FDUSER_ROLE) && dbUser?.fandomUser) {
      await message.channel
        .send({
          embeds: [
            {
              color: 4575254,
              title: 'Ya te has verificado',
              description: `✅ Ya has verificado tu cuenta de Fandom: **${dbUser.fandomUser.username}**\n\nSi quieres cambiar o desconectar tu cuenta, contacta con el <@&${env.STAFF_ROLE}> del servidor.`
            }
          ]
        })
        .catch(client.logException);
      return;
    }

    const fandomUserResolver = Args.make((arg) => Args.ok(arg.substring(0, 255)));
    const fandomUser = await args.restResult(fandomUserResolver);

    if (!fandomUser.success) {
      message.reply('❌ Debes ingresar tu nombre de usuario de Fandom.').catch(client.logException);
      return;
    }

    const { guild, member } = message;
    const logsChannel = guild.channels.resolve(env.LOGS_CHANNEL) as TextChannel;
    const discordTag = `${message.author.username}#${message.author.discriminator}`;

    const interactiveVerifyURL = new URL('https://confederacion-hispana.fandom.com/es/wiki/Especial:VerifyUser');

    interactiveVerifyURL.searchParams.append('useskin', 'fandomdesktop');
    interactiveVerifyURL.searchParams.append('user', message.author.username);
    interactiveVerifyURL.searchParams.append('tag', message.author.discriminator);
    interactiveVerifyURL.searchParams.append('ch', (message.channel as TextChannel).name);
    interactiveVerifyURL.searchParams.append('c', 'c!verify');

    UserVerification.verifyUser(fandomUser.value, message.author.username, message.author.discriminator)
      .then((result) => {
        if (result.success) {
          member.roles
            .add([env.USER_ROLE, env.FDUSER_ROLE], `Verificado como ${fandomUser.value}`)
            .then(async () => {
              member.roles.remove(env.NEWUSER_ROLE).catch(client.logException);
              logsChannel
                .send(`✅ Se verificó a <@!${message.author.id}> con la cuenta de Fandom **${fandomUser.value}**`)
                .catch(client.logException);
              message.channel
                .send({
                  embeds: [
                    {
                      color: 4575254,
                      title: '¡Verificación completada!',
                      description: `✅ Te has autenticado correctamente con la cuenta de Fandom **${fandomUser.value}** y ahora tienes acceso a todos los canales del servidor.\n\n¡Recuerda visitar <#${env.SELFROLES_CHANNEL}> si deseas elegir más roles de tu interés!`
                    }
                  ]
                })
                .catch(client.logException);

              const dbUser = await model.findUserBySnowflake(message.author.id) ?? model.getDefaultUser(message.author.id)

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

              await model.create(dbUser)
                .catch(client.logException);
            })
            .catch(client.logException);
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

          interactiveVerifyURL.pathname += `/${fandomUser.value}`;

          if (result.error === 'Blocked') {
            embed.description += `\n\nEl bloqueo fue efectuado por ${result.blockinfo?.performer}${
              result.blockinfo?.reason ? ` con la razón _${result.blockinfo.reason}_` : ''
            }, y expira ${
              result.blockinfo?.expiry === Infinity
                ? '**nunca**'
                : `el ${formatDate(result.blockinfo?.expiry as Date, 'dd/MM/yyyy')}`
            }.`;
            logsChannel
              .send(
                `⚠️ <@!${message.author.id}> intentó autenticarse con la cuenta de Fandom bloqueada **${fandomUser.value}**.`
              )
              .catch(client.logException);
          }

          if (result.error === 'DiscordHandleNotFound' || result.error === 'DiscordHandleMismatch')
            embed.description += `\n\nPuedes dirigirte a [este enlace](${interactiveVerifyURL.href}) para añadir o actualizar tu tag, luego intenta verificarte nuevamente.`;

          if (result.error === 'DiscordHandleMismatch') {
            client.logger.info('Usuario inició la verificación, discordHandle no coincide', {
              discordTag,
              fandomUser: fandomUser.value
            });
          }

          message.channel.send({ embeds: [embed] }).catch(client.logException);
        }
      })
      .catch((err) => {
        if (err instanceof NonExistentUser) {
          client.logger.info('Usuario inició la verificación, usuario de Fandom no existe', {
            discordTag,
            fandomUser: fandomUser.value
          });

          message.channel
            .send({
              embeds: [
                {
                  color: 14889515,
                  description: `❌ No es posible completar tu verificación porque la cuenta de Fandom que has indicado (${fandomUser.value}) no existe o está deshabilitada.\n\nVerifica que tu nombre de usuario sea el correcto, e inténtalo nuevamente.`,
                  fields: [
                    {
                      name: '¿Tienes algún inconveniente para completar la verificación?',
                      value: `Menciona a algún miembro del <@&${env.STAFF_ROLE}> e intentaremos ayudarte.`
                    }
                  ]
                }
              ]
            })
            .catch(client.logException);
        } else {
          client.logException(err);
          message.channel
            .send({
              embeds: [
                {
                  color: 14889515,
                  description: `❌ Ocurrió un error interno. Por favor intenta nuevamente.\n\nSi sigues recibiendo este mensaje, probablemente esto sea un bug. Menciona a un miembro del <@&${env.STAFF_ROLE}> e intentaremos ayudarte.`
                }
              ]
            })
            .catch(client.logException);
        }
      });
  }
}

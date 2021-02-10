import { URL } from 'url';
import { Command } from 'discord-akairo';
import { Message, TextChannel } from 'discord.js';
import axios from 'axios';

import {
  addDays,
  differenceInDays,
  format as formatDate,
  parse as parseDate
} from 'date-fns';
import { es } from 'date-fns/locale';

import { env } from '../../environment';

class UserVerifyCommand extends Command {
  constructor() {
    super('verify', {
      aliases: ['verify'],
      args: [
        {
          id: 'fandomUser',
          type: 'string'
        }
      ]
    });
  }

  exec(msg: Message, args: { fandomUser: string }): void {
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

    axios.get(env.MW_API, {
      params: {
        action: 'query',
        list: 'users',
        usprop: 'blockinfo|registration|implicitgroups|groups',
        ususers: fandomUser,
        format: 'json'
      }
    }).then(({ data: mwResponse }) => {
      if (mwResponse.error || !mwResponse.query.users[0] || typeof mwResponse.query.users[0].implicitgroups === 'undefined' || mwResponse.query.users[0].missing !== undefined) {
        this.client.logger.info('Usuario inició la verificación, usuario de Fandom no existe', {
          discordTag,
          fandomUser,
          mwResponse
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
        });
        return;
      }

      const mwUser = mwResponse.query.users[0],
        registrationDate = new Date(mwUser.registration);

      if (differenceInDays(Date.now(), registrationDate) < 5) {
        const allowedDate = formatDate(addDays(registrationDate, 5), "d 'de' MMMM 'de' yyyy, h:mm:ss aa", {
          locale: es
        });
        msg.channel.send({
          embed: {
            color: 14889515,
            description: `❌ No es posible completar tu verificación porque la cuenta de Fandom **${fandomUser}** fue registrada hace menos de 5 días.\nPor favor vuelve a intentarlo después del ${allowedDate}.`
          }
        }).catch(this.client.logException);
        return logsChannel.send(`⚠️ <@!${msg.author.id}> intentó autenticarse con la cuenta de Fandom demasiado nueva **${mwUser.name}**.`).catch(this.client.logException);
      }

      if (mwUser.blockreason && mwUser.blockexpiry) {
        const blockExpiry = mwUser.blockexpiry !== 'infinity' ? parseDate(mwUser.blockexpiry, 'yyyyMMddHHmmss', new Date()) : new Date(0);
        msg.channel.send({
          embed: {
            color: 14889515,
            description: `❌ No es posible completar tu verificación porque la cuenta de Fandom **${fandomUser}** está actualmente bloqueada.\nPor favor vuelve a intentarlo cuando el bloqueo haya expirado.\n\nEl bloqueo fue realizado por ${mwUser.blockedby}${mwUser.blockreason ? ` con la razón _${mwUser.blockreason}_` : ''}, y expira ${mwUser.blockexpiry === 'infinity' ? '**nunca**' : `el ${formatDate(blockExpiry, 'dd/MM/yyyy')}`}.`
          }
        }).catch(this.client.logException);
        return logsChannel.send(`⚠️ <@!${msg.author.id}> intentó autenticarse con la cuenta de Fandom bloqueada **${mwUser.name}**.`).catch(this.client.logException);
      }

      // at this point, we can be sure that the account exists and it's not blocked
      interactiveVerifyURL.pathname += `/${fandomUser}`;

      axios.get(`https://services.fandom.com/user-attribute/user/${mwUser.userid}/attr/discordHandle?cb=${Date.now()}`).then((response) => {
        const fdServicesResponse = response.data;
        if (fdServicesResponse.name && fdServicesResponse.value) {
          const expectedTag = fdServicesResponse.value.trim(),
            expectedName = expectedTag.substring(0, expectedTag.lastIndexOf('#')).trim(),
            expectedDisc = expectedTag.substring(expectedTag.lastIndexOf('#') + 1, expectedTag.length).trim();
          if (msg.author.username === expectedName
              && msg.author.discriminator === expectedDisc) {
            member.roles.add([env.USER_ROLE, env.FDUSER_ROLE], `Verificado como ${mwUser.name}`).then(() => {
              member.roles.remove(env.NEWUSER_ROLE).catch(this.client.logException);
              logsChannel.send(`✅ Se verificó a <@!${msg.author.id}> con la cuenta de Fandom **${mwUser.name}**`).catch(this.client.logException);
              msg.channel.send({
                embed: {
                  color: 4575254,
                  title: '¡Verificación completada!',
                  description: `✅ Te has autenticado correctamente con la cuenta de Fandom **${mwUser.name}** y ahora tienes acceso a todos los canales del servidor.\n\n¡Recuerda visitar <#${env.SELFROLES_CHANNEL}> si deseas elegir más roles de tu interés!`
                }
              }).catch(this.client.logException);
            }).catch(this.client.logException);
          } else {
            this.client.logger.info('Usuario inició la verificación, discordHandle no coincide', {
              discordTag,
              servicesApiResponse: fdServicesResponse
            });
            msg.channel.send({
              embed: {
                color: 14889515,
                description: `❌ No es posible completar tu verificación porque tu Discord Tag no coincide con el que se indica en tu perfil de Fandom (tu tag es **${discordTag}**, mientras que tu perfil de Fandom ${fdServicesResponse.value.trim() ? `indica **${fdServicesResponse.value}**` : 'no tiene ningún tag asociado'}). ¿Tal vez olvidaste actualizarlo?\n\nPuedes dirigirte a [este enlace](${interactiveVerifyURL.href}) para actualizar tu tag, luego intenta verificarte nuevamente.`,
                fields: [
                  {
                    name: '¿Tienes algún inconveniente para completar la verificación?',
                    value: `Menciona a algún miembro del <@&${env.STAFF_ROLE}> e intentaremos ayudarte.`
                  }
                ]
              }
            });
          }
        } else {
          this.client.logger.warn('La API de Fandom devolvió cualquier cosa', {
            discordTag,
            mwUser,
            servicesApiResponse: fdServicesResponse
          });
          msg.channel.send({
            embed: {
              color: 14889515,
              description: `❌ No es posible completar tu verificación porque parece no haber ninguna información asociada a tu perfil de Fandom.\n\nPuedes dirigirte a [este enlace](${interactiveVerifyURL.href}) para añadir tu tag, luego intenta verificarte nuevamente.\n\nSi sigues recibiendo este mensaje, probablemente esto sea un bug. Menciona a un miembro del <@&${env.STAFF_ROLE}> e intentaremos ayudarte.`
            }
          });
        }
      }).catch((err) => {
        if (err.response && err.response.status === 404) {
          msg.channel.send({
            embed: {
              color: 14889515,
              description: `❌ No es posible completar tu verificación porque parece no haber ninguna información asociada a tu perfil de Fandom.\n\nPuedes dirigirte a [este enlace](${interactiveVerifyURL.href}) para añadir tu tag, luego intenta verificarte nuevamente.\n\nSi sigues recibiendo este mensaje, probablemente esto sea un bug. Menciona a un miembro del <@&${env.STAFF_ROLE}> e intentaremos ayudarte.`
            }
          });
        } else throw err;
      });
    }).catch((err) => {
      this.client.logException(err);
      msg.channel.send({
        embed: {
          color: 14889515,
          description: `❌ Ocurrió un error interno. Por favor intenta nuevamente.\n\nSi sigues recibiendo este mensaje, probablemente esto sea un bug. Menciona a un miembro del <@&${env.STAFF_ROLE}> e intentaremos ayudarte.`
        }
      }).catch(this.client.logException);
    });
  }
}

export default UserVerifyCommand;

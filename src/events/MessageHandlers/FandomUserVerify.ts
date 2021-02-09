import { Listener } from 'discord-akairo';
import { Message, Role, TextChannel } from 'discord.js';
import axios from 'axios';
import { stringSimilarity } from 'string-similarity-js';
import {
  addDays,
  differenceInDays,
  format as formatDate,
  parse as parseDate
} from 'date-fns';
import { es } from 'date-fns/locale';

import { env } from '../../environment';

class FandomUserVerify extends Listener {
  constructor() {
    super('fandomUserVerify', {
      emitter: 'client',
      event: 'message'
    });
  }

  async exec(message: Message) {
    if (message.channel.id !== env.VERIF_CHANNEL) return;
    if (message.author.bot) return;
    if (!message.guild || !message.member) return;
    if (message.member.roles.cache.has(env.USER_ROLE)) return;
    if (!message.content) return;

    const { guild, member } = message;

    const lines = message.content.split(/[\r\n]+/).filter((n) => n.trim()),
      data: { [k: string]: any } = {
        usuario: '',
        wikis: [],
        invitacion: ''
      };
    lines.forEach((line) => {
      const parts = line.split(/:(.+)/).map((n) => n.trim()).filter((n) => n.trim()); // TODO: find a better way (?)
      if (!(parts[0] && parts[1])) return;
      let key = parts[0].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(),
        value: string | string[] = parts[1];
      key = key.replace(/^\d{1,2}[.-]*\s?/, '');
      if (key === 'user') key = 'usuario';
      if (key === 'wiki') key = 'wikis';
      if (key === 'wikis') value = value.split(',').map((n) => n.trim()).filter((n) => n.trim());
      data[key] = value;
    });

    if (data.usuario && data.wikis && data.wikis.length && data.invitacion) {
      const logsChannel = guild.channels.resolve(env.LOGS_CHANNEL) as TextChannel;
      try {
        const discordTag = `${message.author.username}#${message.author.discriminator}`;
        const { data: mwResponse } = await axios.get(env.MW_API, {
          params: {
            action: 'query',
            list: 'users',
            usprop: 'blockinfo|registration|implicitgroups|groups',
            ususers: data.usuario,
            format: 'json'
          }
        });
        if (mwResponse.error || !mwResponse.query.users[0] || typeof mwResponse.query.users[0].implicitgroups === 'undefined' || mwResponse.query.users[0].missing !== undefined) {
          this.client.logger.info('Usuario inició la verificación, usuario de Fandom no existe', {
            discordTag,
            verifyData: data,
            mwResponse
          });
          message.channel.send({
            embed: {
              color: 14889515,
              description: `❌ No es posible completar tu verificación porque la cuenta de Fandom que has indicado (${data.usuario}) no existe o está deshabilitada.\n\nVerifica que tu nombre de usuario sea el correcto, luego envía tu formulario nuevamente.`,
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
          message.channel.send({
            embed: {
              color: 14889515,
              description: `❌ No es posible completar tu verificación porque la cuenta de Fandom **${data.usuario}** fue registrada hace menos de 5 días.\nPor favor vuelve a intentarlo después del ${allowedDate}.`
            }
          }).catch(this.client.logException);
          return logsChannel.send(`⚠️ <@!${message.author.id}> intentó autenticarse con la cuenta de Fandom demasiado nueva **${mwUser.name}**.`).catch(this.client.logException);
        }

        if (mwUser.blockreason && mwUser.blockexpiry) {
          const blockExpiry = mwUser.blockexpiry !== 'infinity' ? parseDate(mwUser.blockexpiry, 'yyyyMMddHHmmss', new Date()) : new Date(0);
          message.channel.send({
            embed: {
              color: 14889515,
              description: `❌ No es posible completar tu verificación porque la cuenta de Fandom **${data.usuario}** está actualmente bloqueada.\nPor favor vuelve a intentarlo cuando el bloqueo haya expirado.\n\nEl bloqueo fue realizado por ${mwUser.blockedby}${mwUser.blockreason ? ` con la razón _${mwUser.blockreason}_` : ''}, y expira ${mwUser.blockexpiry === 'infinity' ? '**nunca**' : `el ${formatDate(blockExpiry, 'dd/MM/yyyy')}`}.`
            }
          }).catch(this.client.logException);
          return logsChannel.send(`⚠️ <@!${message.author.id}> intentó autenticarse con la cuenta de Fandom bloqueada **${mwUser.name}**.`).catch(this.client.logException);
        }

        axios.get(`https://services.fandom.com/user-attribute/user/${mwUser.userid}/attr/discordHandle?cb=${Date.now()}`).then((response) => {
          const fdServicesResponse = response.data;
          if (fdServicesResponse.name && fdServicesResponse.value) {
            const expectedTag = fdServicesResponse.value.trim(),
              expectedName = expectedTag.substring(0, expectedTag.lastIndexOf('#')).trim(),
              expectedDisc = expectedTag.substring(expectedTag.lastIndexOf('#') + 1, expectedTag.length).trim();
            if (message.author.username === expectedName
                && message.author.discriminator === expectedDisc) {
              member.roles.add([env.USER_ROLE, env.FDUSER_ROLE], `Verificado como ${mwUser.name}`).then(() => {
                member.roles.remove(env.NEWUSER_ROLE).catch(this.client.logException);
                logsChannel.send(`✅ Se verificó a <@!${message.author.id}> con la cuenta de Fandom **${mwUser.name}**`).catch(this.client.logException);
                const guildRoles = guild.roles.cache,
                  wikiIndexRole = guild.roles.resolve(env.WIKI_ROLE_GROUP) as Role,
                  assignedRoles: Role[] = [];
                guildRoles.each((role) => {
                  if (role.position >= wikiIndexRole.position) return;
                  if (role.position === 0) return; // @everyone role
                  data.wikis.forEach((wikiName: string) => {
                    const similarityScore = stringSimilarity(wikiName, role.name);
                    if (similarityScore > 0.75) {
                      member.roles.add(role).catch(this.client.logException);
                      assignedRoles.push(role);
                    }
                  });
                });
                // eslint-disable-next-line max-len
                if (assignedRoles.length) member.roles.add(env.WIKI_ROLE_GROUP).catch(this.client.logException);
                message.channel.send({
                  embed: {
                    color: 4575254,
                    title: '¡Verificación completada!',
                    description: `✅ Te has autenticado correctamente con la cuenta de Fandom **${mwUser.name}** y ahora tienes acceso a todos los canales del servidor.${assignedRoles.length ? `\n\nDe acuerdo a tus wikis, se te han asignado los siguientes roles: ${assignedRoles.map((role) => `<@&${role.id}>`).join(', ')}` : ''}\n\n¡Recuerda visitar <#${env.SELFROLES_CHANNEL}> si deseas elegir más roles de tu interés!`
                  }
                }).catch(this.client.logException);
              }).catch(this.client.logException);
            } else {
              this.client.logger.info('Usuario inició la verificación, discordHandle no coincide', {
                discordTag,
                servicesApiResponse: fdServicesResponse
              });
              message.channel.send({
                embed: {
                  color: 14889515,
                  description: `❌ No es posible completar tu verificación porque tu Discord Tag no coincide con el que se indica en tu perfil de Fandom (tu tag es **${discordTag}**, mientras que tu perfil de Fandom ${fdServicesResponse.value.trim() ? `indica **${fdServicesResponse.value}**` : 'no tiene ningún tag asociado'}). ¿Tal vez olvidaste actualizarlo?\n\nDirígete a [tu perfil de Fandom](https://comunidad.fandom.com/wiki/Usuario:${mwUser.name.replace(/ /g, '_')}) y verifica que tu tag esté correcto y actualizado, luego envía tu formulario nuevamente.`,
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
            message.channel.send({
              embed: {
                color: 14889515,
                description: `❌ No es posible completar tu verificación porque parece no haber ninguna información asociada a tu perfil de Fandom.\n\nDirígete a [tu perfil de Fandom](https://comunidad.fandom.com/wiki/Usuario:${mwUser.name.replace(/ /g, '_')}) y verifica que tu tag esté correcto y actualizado, luego envía tu formulario nuevamente.\n\nSi sigues recibiendo este mensaje, probablemente esto sea un bug. Menciona a un miembro del <@&${env.STAFF_ROLE}> para verificarte manualmente.`
              }
            });
          }
        }).catch((err) => {
          if (err.response && err.response.status === 404) {
            message.channel.send({
              embed: {
                color: 14889515,
                description: `❌ No es posible completar tu verificación porque parece no haber ninguna información asociada a tu perfil de Fandom.\n\nDirígete a [tu perfil de Fandom](https://comunidad.fandom.com/wiki/Usuario:${mwUser.name.replace(/ /g, '_')}) y verifica que tu tag esté correcto y actualizado, luego envía tu formulario nuevamente.\n\nSi sigues recibiendo este mensaje, probablemente esto sea un bug. Menciona a un miembro del <@&${env.STAFF_ROLE}> para verificarte manualmente.`
              }
            });
          } else throw err;
        });
      } catch (err) {
        this.client.logException(err);
        message.channel.send({
          embed: {
            color: 14889515,
            description: `❌ Ocurrió un error interno. Por favor intenta nuevamente.\n\nSi sigues recibiendo este mensaje, probablemente esto sea un bug. Menciona a un miembro del <@&${env.STAFF_ROLE}> para verificarte manualmente.`
          }
        });
      }
    } else {
      // el mensaje no está en el formato esperado. ¿hacer algo?
    }
  }
}

export default FandomUserVerify;

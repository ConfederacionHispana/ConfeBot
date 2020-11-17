import { Listener } from 'discord-akairo';
import axios from 'axios';
import { stringSimilarity } from 'string-similarity-js';
import { formatDate, parseBlockExpiry } from '../Util';

class MessageListener extends Listener {
  constructor() {
    super('message', {
      emitter: 'client',
      event: 'message'
    });
  }

  async exec(msg) {
    if (msg.channel.id !== process.env.VERIF_CHANNEL) return;
    if (msg.author.bot) return;
    if (msg.member.roles.cache.has(process.env.USER_ROLE)) return;
    if (!msg.content) return;

    const lines = msg.content.split(/[\r\n]+/).filter((n) => n.trim()),
      data = {};
    lines.forEach((line) => {
      const parts = line.split(/:(.+)/).map((n) => n.trim()).filter((n) => n.trim()); // TODO: find a better way (?)
      if (!(parts[0] && parts[1])) return;
      let key = parts[0].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(),
        value = parts[1];
      key = key.replace(/^\d{1,2}[.-]*\s?/, '');
      if (key === 'user') key = 'usuario';
      if (key === 'wiki') key = 'wikis';
      if (key === 'wikis') value = value.split(',').map((n) => n.trim()).filter((n) => n.trim());
      data[key] = value;
    });

    if (data.usuario && data.wikis && data.wikis.length && data.invitacion) {
      const logsChannel = msg.guild.channels.resolve(process.env.LOGS_CHANNEL);
      try {
        const discordTag = `${msg.author.username}#${msg.author.discriminator}`;
        const { data: mwResponse } = await axios.get(process.env.MW_API, {
          params: {
            action: 'query',
            list: 'users',
            usprop: 'blockinfo|registration|implicitgroups|groups',
            ususers: data.usuario,
            format: 'json'
          }
        });
        if (mwResponse.error || !mwResponse.query.users[0] || typeof mwResponse.query.users[0].implicitgroups === 'undefined' || mwResponse.query.users[0].missing !== undefined) {
          this.client.rollbar.info('Usuario inició la verificación, usuario de Fandom no existe', {
            discordTag,
            verifyData: data,
            mwResponse
          });
          return msg.channel.send({
            embed: {
              color: 14889515,
              description: `❌ No es posible completar tu verificación porque la cuenta de Fandom que has indicado (${data.usuario}) no existe o está deshabilitada.\n\nVerifica que tu nombre de usuario sea el correcto, luego envía tu formulario nuevamente.`,
              fields: [
                {
                  name: '¿Tienes algún inconveniente para completar la verificación?',
                  value: `Menciona a algún miembro del <@&${process.env.STAFF_ROLE}> e intentaremos ayudarte.`
                }
              ]
            }
          });
        }
        const mwUser = mwResponse.query.users[0];
        if (mwUser.blockreason && mwUser.blockexpiry) {
          const blockExpiry = mwUser.blockexpiry !== 'infinity' ? parseBlockExpiry(mwUser.blockexpiry) : null;
          msg.channel.send({
            embed: {
              color: 14889515,
              description: `❌ No es posible completar tu verificación porque la cuenta de Fandom **${data.usuario}** está actualmente bloqueada.\nPor favor vuelve a intentarlo cuando el bloqueo haya expirado.\n\nEl bloqueo fue realizado por ${mwUser.blockedby}${mwUser.blockreason ? ` con la razón _${mwUser.blockreason}_` : ''}, y expira ${mwUser.blockexpiry === 'infinity' ? '**nunca**' : `el ${formatDate(blockExpiry)}`}.`
            }
          }).catch(this.client.rollbar.error);
          return logsChannel.send(`⚠️ <@!${msg.author.id}> intentó autenticarse con la cuenta de Fandom bloqueada **${mwUser.name}**.`).catch(this.client.rollbar.error);
        }
        const { data: fdServicesResponse } = await axios.get(`https://services.fandom.com/user-attribute/user/${mwUser.userid}/attr/discordHandle?cb=${Date.now()}`);
        if (fdServicesResponse.name && fdServicesResponse.value) {
          if (fdServicesResponse.value.trim() === discordTag) {
            msg.member.roles.add(process.env.USER_ROLE).then(() => {
              msg.member.roles.remove(process.env.NEWUSER_ROLE).catch(this.client.rollbar.error);
              logsChannel.send(`✅ Se verificó a <@!${msg.author.id}> con la cuenta de Fandom **${mwUser.name}**`).catch(this.client.rollbar.error);
              const guildRoles = msg.guild.roles.cache,
                wikiIndexRole = msg.guild.roles.resolve(process.env.WIKI_ROLE_GROUP),
                assignedRoles = [];
              guildRoles.each((role) => {
                if (role.position >= wikiIndexRole.position) return;
                if (role.position === 0) return; // @everyone role
                data.wikis.forEach((wikiName) => {
                  const similarityScore = stringSimilarity(wikiName, role.name);
                  if (similarityScore > 0.75) {
                    msg.member.roles.add(role).catch(this.client.rollbar.error);
                    assignedRoles.push(role);
                  }
                });
              });
              // eslint-disable-next-line max-len
              if (assignedRoles.length) msg.member.roles.add(process.env.WIKI_ROLE_GROUP).catch(this.client.rollbar.error);
              msg.channel.send({
                embed: {
                  color: 4575254,
                  title: '¡Verificación completada!',
                  description: `✅ Te has autenticado correctamente con la cuenta de Fandom **${mwUser.name}** y ahora tienes acceso a todos los canales del servidor.${assignedRoles.length ? `\n\nDe acuerdo a tus wikis, se te han asignado los siguientes roles: ${assignedRoles.map((role) => `<@&${role.id}>`).join(', ')}` : ''}\n\n¡Recuerda visitar <#${process.env.SELFROLES_CHANNEL}> si deseas elegir más roles de tu interés!`
                }
              }).catch(this.client.rollbar.error);
            }).catch(this.client.rollbar.error);
          } else {
            this.client.rollbar.info('Usuario inició la verificación, discordHandle no coincide', {
              discordTag,
              servicesApiResponse: fdServicesResponse
            });
            msg.channel.send({
              embed: {
                color: 14889515,
                description: `❌ No es posible completar tu verificación porque tu Discord Tag no coincide con el que se indica en tu perfil de Fandom (tu tag es **${discordTag}**, mientras que tu perfil de Fandom ${fdServicesResponse.value.trim() ? `indica **${fdServicesResponse.value}**` : 'no tiene ningún tag asociado'}). ¿Tal vez olvidaste actualizarlo?\n\nDirígete a [tu perfil de Fandom](https://comunidad.fandom.com/wiki/Usuario:${mwUser.name.replace(/ /g, '_')}) y verifica que tu tag esté correcto y actualizado, luego envía tu formulario nuevamente.`,
                fields: [
                  {
                    name: '¿Tienes algún inconveniente para completar la verificación?',
                    value: `Menciona a algún miembro del <@&${process.env.STAFF_ROLE}> e intentaremos ayudarte.`
                  }
                ]
              }
            });
          }
        } else {
          this.client.rollbar.warning('La API de Fandom devolvió cualquier cosa', {
            discordTag,
            mwUser,
            servicesApiResponse: fdServicesResponse
          });
          msg.channel.send({
            embed: {
              color: 14889515,
              description: `❌ No es posible completar tu verificación porque parece no haber ninguna información asociada a tu perfil de Fandom.\n\nDirígete a [tu perfil de Fandom](https://comunidad.fandom.com/wiki/Usuario:${mwUser.name.replace(/ /g, '_')}) y verifica que tu tag esté correcto y actualizado, luego envía tu formulario nuevamente.\n\nSi sigues recibiendo este mensaje, probablemente esto sea un bug. Menciona a un miembro del <@&${process.env.STAFF_ROLE}> para verificarte manualmente.`
            }
          });
        }
      } catch (err) {
        this.client.rollbar.error(err);
        msg.channel.send({
          embed: {
            color: 14889515,
            description: `❌ Ocurrió un error interno. Por favor intenta nuevamente.\n\nSi sigues recibiendo este mensaje, probablemente esto sea un bug. Menciona a un miembro del <@&${process.env.STAFF_ROLE}> para verificarte manualmente.`
          }
        });
      }
    } else {
      // el mensaje no está en el formato esperado. ¿hacer algo?
    }
  }
}

export default MessageListener;

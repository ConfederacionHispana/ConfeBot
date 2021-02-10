import { URL } from 'url';
import { Listener } from 'discord-akairo';
import { GuildMember, MessageReaction, TextChannel } from 'discord.js';
import { env } from '../environment';

class MemberAddListener extends Listener {
  constructor() {
    super('guildMemberUpdate', {
      emitter: 'client',
      event: 'guildMemberUpdate'
    });
  }

  exec(oldMember: GuildMember, newMember: GuildMember): void {
    if (newMember.guild.id !== env.GUILD_ID) return;
    if (newMember.user.bot) return;
    if (oldMember.pending && !newMember.pending) {
      this.client.logger.info('Miembro aceptó las reglas', {
        userId: newMember.user.id,
        userTag: `${newMember.user.username}#${newMember.user.discriminator}`,
        source: 'user-log'
      });

      const welcomeChannel = newMember.guild.channels.resolve(env.WELCOME_CHANNEL) as TextChannel,
        logsChannel = newMember.guild.channels.resolve(env.LOGS_CHANNEL) as TextChannel;

      const interactiveVerifyURL = new URL('https://confederacion-hispana.fandom.com/es/wiki/Especial:VerifyUser');

      interactiveVerifyURL.searchParams.append('user', newMember.user.username);
      interactiveVerifyURL.searchParams.append('tag', newMember.user.discriminator);
      interactiveVerifyURL.searchParams.append('ch', (this.client.channels.resolve(env.VERIF_CHANNEL) as TextChannel).name);
      interactiveVerifyURL.searchParams.append('c', 'c!verify');

      newMember.roles.add(env.NEWUSER_ROLE).then(() => {
        welcomeChannel.send(`¡Bienvenid@ <@!${newMember.user.id}> a la **Confederación de Fandom Hispano**!`, {
          embed: {
            color: 2936518,
            thumbnail: {
              url: 'https://vignette4.wikia.nocookie.net/confederacion-hispana/es/images/8/89/Wiki-wordmark.png'
            },
            description: `Para acceder a todos los canales del servidor, necesitamos que completes una pequeña verificación:\n\nSi aún no lo has hecho, dirígete a tu perfil de Fandom, y en la parte superior (perfil global) añade tu Discord Tag en el campo destinado a ello. También puedes ingresar a [este enlace](${interactiveVerifyURL.href}) para agregar tu tag automáticamente.\n\nLuego, envía un mensaje en <#${env.VERIF_CHANNEL}> con el comando \`c!verify TuNombreDeUsuario\`.`,
            fields: [
              {
                name: '¿No tienes una cuenta en Fandom?',
                value: 'Reacciona con el emoji 🌐 para ingresar como invitado.'
              },
              {
                name: '¿Tienes algún incoveniente para completar la verificación?',
                value: `Menciona a algún miembro del <@&${env.STAFF_ROLE}> e intentaremos ayudarte.`
              }
            ]
          }
        }).then((sentMessage) => {
          sentMessage.react('🌐').catch(this.client.logException);
          const filter = (reaction: MessageReaction, user: GuildMember) => ['🌐'].includes(reaction.emoji.name) && user.id === newMember.id;
          sentMessage.awaitReactions(filter, {
            max: 1,
            time: 3600000, // 1h
            errors: ['time']
          }).then((collected) => {
            const reaction = collected.first();
            if (reaction && reaction.emoji.name === '🌐') {
              newMember.roles.add(env.USER_ROLE).then(() => {
                newMember.roles.remove(env.NEWUSER_ROLE);
                // TODO: log in db
                this.client.logger.info('User authenticated as guest', {
                  member: newMember.user.id
                });
              }).catch((err) => {
                this.client.logException(err, {
                  user_id: newMember.user.id
                });
              });
            }
          }).catch(() => {
            // idk lol
          });
        }).catch((err) => {
          logsChannel.send(`❌ Imposible enviar mensaje de bienvenida a <@!${newMember.user.id}>: ${err.message} (${err.name})`).catch(this.client.logException);
          this.client.logException(err);
        });
      }).catch((err) => {
        logsChannel.send(`❌ Imposible agregar el rol Nuevo Ingreso a <@!${newMember.user.id}>: ${err.message} (${err.name})`).catch(this.client.logException);
        this.client.logException(err);
      });
    }
  }
}

export default MemberAddListener;

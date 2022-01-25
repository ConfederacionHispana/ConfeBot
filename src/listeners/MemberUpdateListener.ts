import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { URL } from 'url';
import { env } from '../lib';

import type { ListenerOptions } from '@sapphire/framework';
import type { GuildMember, MessageReaction, TextChannel, User } from 'discord.js';

@ApplyOptions<ListenerOptions>({
  event: Events.GuildMemberUpdate
})
export class MemberUpdateListener extends Listener {
  public async run(oldMember: GuildMember, newMember: GuildMember): Promise<void> {
    const { client } = this.container;

    if (newMember.guild.id !== env.GUILD_ID) return;
    if (newMember.user.bot) return;
    if (oldMember.pending && !newMember.pending) {
      client.logger.info('Miembro aceptó las reglas', {
        userId: newMember.user.id,
        userTag: `${newMember.user.username}#${newMember.user.discriminator}`,
        source: 'user-log'
      });

      const welcomeChannel = newMember.guild.channels.resolve(env.WELCOME_CHANNEL) as TextChannel;
      const logsChannel = newMember.guild.channels.resolve(env.LOGS_CHANNEL) as TextChannel;

      // kick if the account was created recently and joined from the widget invite
      const minimumMS = Date.now() - 1000 * 60 * 60 * 24 * 3; // 3 days
      const ageMS = newMember.user.createdAt.getTime();
      if (minimumMS < ageMS) {
        const guild = client.guilds.resolve(env.GUILD_ID);
        const invites = await guild?.invites?.fetch();
        const widgetInvite = invites?.find((invite) => !invite.inviter);
        if (widgetInvite) {
          const usedWidgetInvite =
            widgetInvite.code === client.cache.widgetInvite.code &&
            widgetInvite.uses === client.cache.widgetInvite.uses + 1;
          const usedNewWidgetInvite = widgetInvite.code !== client.cache.widgetInvite.code && widgetInvite.uses === 1;
          if (usedWidgetInvite || usedNewWidgetInvite) {
            if (usedWidgetInvite) client.cache.widgetInvite.uses += 1;
            else {
              // a new invite was generated
              client.cache.widgetInvite = {
                code: widgetInvite.code,
                uses: widgetInvite.uses ?? 0
              };
            }
            newMember
              .kick('Cuenta creada hace menos de 3 días.')
              .then(() => {
                // log everywhere
                client.logger.info(
                  `<@!${newMember.user.id}> (${newMember.user.tag}) expulsado del servidor por tener menos de 3 días desde la creación de su cuenta.`
                );
                logsChannel
                  .send(
                    `<@!${newMember.user.id}> (${newMember.user.tag}) expulsado del servidor por tener menos de 3 días desde la creación de su cuenta.`
                  )
                  .catch(client.logException);
              })
              .catch(client.logException);

            return;
          }
        } else {
          client.logger.warn('No he podido encontrar una invitación por widget.');
        }
      }

      const interactiveVerifyURL = new URL('https://confederacion-hispana.fandom.com/es/wiki/Especial:VerifyUser');

      interactiveVerifyURL.searchParams.append('useskin', 'fandomdesktop');
      interactiveVerifyURL.searchParams.append('user', newMember.user.username);
      interactiveVerifyURL.searchParams.append('tag', newMember.user.discriminator);
      interactiveVerifyURL.searchParams.append('ch', (client.channels.resolve(env.VERIF_CHANNEL) as TextChannel).name);
      interactiveVerifyURL.searchParams.append('c', 'c!verify');

      newMember.roles
        .add(env.NEWUSER_ROLE)
        .then(() => {
          welcomeChannel
            .send({
              content: `¡Bienvenid@ <@!${newMember.user.id}> a la **Confederación de Fandom Hispano**!`,
              embeds: [
                {
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
              ]
            })
            .then((sentMessage) => {
              sentMessage.react('🌐').catch(client.logException);
              const filter = (reaction: MessageReaction, user: User) =>
                ['🌐'].includes(reaction.emoji.name as string) && user.id === newMember.id;
              sentMessage
                .awaitReactions({
                  filter,
                  max: 1,
                  time: 3600000, // 1h
                  errors: ['time']
                })
                .then((collected) => {
                  const reaction = collected.first();
                  if (reaction && reaction.emoji.name === '🌐') {
                    newMember.roles
                      .add(env.USER_ROLE)
                      .then(() => {
                        newMember.roles.remove(env.NEWUSER_ROLE).catch(client.logException);
                        // TODO: log in db
                        client.logger.info('User authenticated as guest', {
                          member: newMember.user.id
                        });
                        logsChannel
                          .send(`✅ Se verificó a <@!${newMember.user.id}> como invitado`)
                          .catch(client.logException);
                      })
                      .catch((err) => {
                        client.logException(err, {
                          user_id: newMember.user.id
                        });
                      });
                  }
                })
                .catch(client.logException);
            })
            .catch((err) => {
              logsChannel
                .send(
                  `❌ Imposible enviar mensaje de bienvenida a <@!${newMember.user.id}>: ${err.message} (${err.name})`
                )
                .catch(client.logException);
              client.logException(err);
            });
        })
        .catch((err) => {
          logsChannel
            .send(`❌ Imposible agregar el rol Nuevo Ingreso a <@!${newMember.user.id}>: ${err.message} (${err.name})`)
            .catch(client.logException);
          client.logException(err);
        });
    }
  }
}

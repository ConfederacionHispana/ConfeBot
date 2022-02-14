import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { env } from '../lib';
import { Time } from '../lib/util/constants';

import type { ListenerOptions } from '@sapphire/framework';
import type { GuildMember, TextChannel } from 'discord.js';

@ApplyOptions<ListenerOptions>({
  event: Events.GuildMemberUpdate
})
export class MemberUpdateListener extends Listener {
  public async run(oldMember: GuildMember, newMember: GuildMember): Promise<void> {
    const { client, tasks } = this.container;

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

      try {
        await newMember.roles.add(env.NEWUSER_ROLE).catch(client.logException);

        await welcomeChannel.send({
          content: `¡Bienvenid@ <@!${newMember.user.id}> a la **Confederación de Fandom Hispano**!`,
          embeds: [
            {
              color: 2936518,
              thumbnail: {
                url: 'https://vignette4.wikia.nocookie.net/confederacion-hispana/es/images/8/89/Wiki-wordmark.png'
              },
              description: `Somos una organización sin ánimo de lucro, y nuestro objetivo es unir wikis de habla hispana en un mismo servidor.`,
              fields: [
                {
                  name: 'Desbloquea más canales',
                  value: `Si tienes una cuenta de Fandom, puedes verificarte y acceder a canales para obtener ayuda con tu wiki, ayuda sobre CSS, y promocionar tu comunidad.\n\nPara verificarte, dirígete a <#${env.VERIF_CHANNEL}> y escribe \`c!verify\`.`
                }
              ]
            }
          ]
        });

        tasks.create(
          'AutoVerify',
          {
            userId: newMember.user.id
          },
          Time.Day * 3
        );
      } catch (err) {
        if (err instanceof Error) {
          client.logException(err);
        }
      }
    }
  }
}

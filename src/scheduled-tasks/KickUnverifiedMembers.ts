import type { PieceContext } from '@sapphire/framework';
import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';
import type { Guild, Role, TextChannel } from 'discord.js';

import { env, Time } from '../lib'

export class IntervalTask extends ScheduledTask {
  public constructor(context: PieceContext) {
    super(context, {
      interval: Time.Hour
    });
  }

  public async run(): Promise<void> {
    const { client } = this.container;

    client.logger.info('Running scheduled task: KickNonVerifiedMembers');
    const guild = client.guilds.resolve(env.GUILD_ID) as Guild;
    const newUserRole = guild.roles.resolve(env.NEWUSER_ROLE) as Role;
    const logsChannel = guild.channels.resolve(env.LOGS_CHANNEL) as TextChannel;

    for (const [, member] of newUserRole.members.entries()) {
      if (member.roles.cache.has(env.USER_ROLE)) {
        /*
         * if member has already verified but still has the newUserRole, remove newUserRole from them.
         * this normally shouldn't happen, but... ¯\_(ツ)_/¯
         */
        member.roles.remove(newUserRole).catch(client.logException);
        continue;
      }
      if (!member.joinedTimestamp) continue;

      const timestampDifference = new Date().getTime() - member.joinedTimestamp;
      const differenceDays = timestampDifference / (1000 * 3600 * 24);
      if (differenceDays >= 2) {
        try {
          await member
            .send(
              `¡Hola! Esto es una notificación para informarte que se te ha expulsado automáticamente de la **Confederación de Fandom Hispano** porque no has completado a tiempo el formulario. No te preocupes, puedes volver a unirte cuando desees mediante este enlace: <${env.GUILD_INVITE}>, o desde <https://confederacion-hispana.fandom.com/es/>. ¡Te esperamos!`
            )
            .catch(client.logException);

          await member.kick('Expulsión automática pasadas 48 horas sin llenar el formulario');
          client.logger.info(`Kicked ${member.user.username}#${member.user.discriminator}`, {
            task: 'KickNonVerifiedMembers'
          });

          await logsChannel
            .send(
              `Se expulsó a <@!${member.user.id}> (${member.user.username}#${member.user.discriminator}) al cumplirse 48 horas sin llenar el formulario.`
            )
            .catch(client.logException);
        } catch (err) {
          if (err instanceof Error) {
            client.logException(err);
            logsChannel
              .send(`Error al expulsar a <@!${member.user.id}>: ${err.message} (${err.name})`)
              .catch(client.logException);
          }
        }
      }
    }
  }
}

declare module '@sapphire/framework' {
  interface ScheduledTasks {
    interval: never;
  }
}

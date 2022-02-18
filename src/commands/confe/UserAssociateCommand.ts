import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { env, FandomUtilities, NonExistentUser } from '../../lib';

import type { CommandOptions } from '@sapphire/framework';
import type { Message, TextChannel } from 'discord.js';

@ApplyOptions<CommandOptions>({
  aliases: ['associate', 'forceverify', 'manualverify'],
  flags: ['guest']
})
export class UserAssociateCommand extends Command {
  public async messageRun(message: Message, args: Args): Promise<void> {
    const memberHasRole = message.member?.roles.cache.has(env.STAFF_ROLE);
    if (!memberHasRole) return;

    const { client } = this.container;

    const targetUserMatch = await args.pickResult('member');
    if (!targetUserMatch.success) {
      message.reply('❓ No encontré al usuario que buscas.').catch(client.logException);
      return;
    }
    const targetUser = targetUserMatch.value;
    const guestFlag = args.getFlags('guest');
    const fandomUserMatch = await args.restResult('string');
    if (!fandomUserMatch.success && !guestFlag) {
      message
        .reply('❓ Se requiere un nombre de usuario de Fandom, o el flag `--guest` para verificar como invitado.')
        .catch(client.logException);
      return;
    }

    const fandomUser = fandomUserMatch.value;

    if (fandomUser) {
      try {
        const mwUser = await FandomUtilities.getUserInfo('comunidad', fandomUser);

        const { id } = targetUser;
        const model = this.container.stores.get('models').get('user');
        const dbUser = await model.findUserBySnowflake(id) ?? model.getDefaultUser(id);

        dbUser.fandomUser = {
          username: mwUser.name,
          userId: mwUser.userid,
          verifiedAt: new Date()
        };

        dbUser.fandomAccountEvents = dbUser.fandomAccountEvents.concat({
          date: new Date(),
          event: 'userVerify',
          account: {
            username: mwUser.name,
            userId: mwUser.userid
          }
        });

        await model.create(dbUser)
          .catch(client.logException);
      } catch (err) {
        if (err instanceof Error) {
          message
            .reply(
              `❌ ${err instanceof NonExistentUser ? 'La cuenta de usuario especificada no existe.' : err.message}`
            )
            .catch(client.logException);
          return;
        }
      }
    }

    const logsChannel = message.guild?.channels.resolve(env.LOGS_CHANNEL) as TextChannel;
    const rolesToAdd = fandomUser ? [env.USER_ROLE, env.FDUSER_ROLE] : [env.USER_ROLE];
    const logReason = `✅ <@!${message.member?.id}> verificó a <@!${targetUser.id}> ${
      fandomUser ? `con la cuenta de Fandom **${fandomUser}**` : 'como invitado'
    }`;

    targetUser.roles
      .add(
        rolesToAdd,
        `Verificado manualmente por ${message.member?.user.username}#${message.member?.user.discriminator}`
      )
      .then(() => {
        targetUser.roles.remove(env.NEWUSER_ROLE).catch(client.logException);
        logsChannel.send(logReason).catch(client.logException);
        message.react('✅').catch(client.logException);
      })
      .catch(client.logException);
  }
}

import { Command } from 'discord-akairo';
import type { GuildMember, Message, TextChannel } from 'discord.js';
import { env } from '../../environment';
import DBModels from '../../db';
import FandomUtilities from '../../util/FandomUtilities';
import NonExistentUser from '../../util/errors/NonExistentUser';

class UserAssociateCommand extends Command {
  constructor() {
    super('associate', {
      aliases: ['associate', 'forceverify', 'manualverify'],
      args: [
        {
          id: 'member',
          type: 'member'
        },
        {
          id: 'fandomUser',
          match: 'rest',
          type: 'string'
        },
        {
          id: 'guest',
          match: 'flag',
          flag: '--guest'
        }
      ]
    });
  }

  async exec(message: Message, args: {
    member?: GuildMember,
    fandomUser?: string,
    guest?: boolean
  }): Promise<void> {
    const memberHasRole = message.member?.roles.cache.has(env.STAFF_ROLE);
    if (!memberHasRole) return;

    if (!args.member) {
      message.reply('❓ No encontré al usuario que buscas.').catch(this.client.logException);
      return;
    }

    if (!args.fandomUser && !args.guest) {
      message.reply('❓ Se requiere un nombre de usuario de Fandom, o el flag `--guest` para verificar como invitado.').catch(this.client.logException);
      return;
    }

    if (args.fandomUser) {
      try {
        const mwUser = await FandomUtilities.getUserInfo('comunidad', args.fandomUser);

        const { id } = args.member;
        const dbUser = await DBModels.User.findOne({ id }) || new DBModels.User({ id });

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

        dbUser.save().catch(this.client.logException);
      } catch (err) {
        message.reply(`❌ ${err instanceof NonExistentUser ? 'La cuenta de usuario especificada no existe.' : err.message}`).catch(this.client.logException);
        return;
      }
    }

    const logsChannel = message.guild?.channels.resolve(env.LOGS_CHANNEL) as TextChannel;
    const rolesToAdd = args.fandomUser ? [env.USER_ROLE, env.FDUSER_ROLE] : [env.USER_ROLE];
    const logReason = `✅ <@!${message.member?.id}> verificó a <@!${args.member!.id}> ${args.fandomUser ? `con la cuenta de Fandom **${args.fandomUser}**` : 'como invitado'}`;

    args.member!.roles.add(rolesToAdd, `Verificado manualmente por ${message.member?.user.username}#${message.member?.user.discriminator}`).then(async () => {
      args.member!.roles.remove(env.NEWUSER_ROLE).catch(this.client.logException);
      logsChannel.send(logReason).catch(this.client.logException);
      message.react('✅').catch(this.client.logException);
    }).catch(this.client.logException);
  }
}

export default UserAssociateCommand;

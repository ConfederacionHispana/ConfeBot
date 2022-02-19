import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, Args, Command } from '@sapphire/framework';
import { env, FandomUtilities, NonExistentUser } from '../../lib';

import type { CommandOptions } from '@sapphire/framework';
import type { CommandInteraction, Guild, GuildMember, Message, TextChannel, User } from 'discord.js';

@ApplyOptions<CommandOptions>({
  aliases: ['forceverify', 'manualverify'],
  description: 'Verifica manualmente a un usuario.',
  flags: ['guest'],
  name: 'associate',
  preconditions: ['StaffOnly'],
  runIn: 'GUILD_ANY'
})
export class UserAssociateCommand extends Command {
  public override registerApplicationCommands(registry: ApplicationCommandRegistry): void {
    registry.registerChatInputCommand(
      {
        description: this.description,
        name: this.name,
        options: [
          {
            description: 'Miembro del servidor a verificar',
            name: 'miembro',
            required: true,
            type: 'USER'
          },
          {
            description: 'Nombre de usuario en Fandom',
            name: 'usuario',
            required: false,
            type: 'STRING'
          },
          {
            description: 'Verificar como invitado',
            name: 'invitado',
            required: false,
            type: 'BOOLEAN'
          }
        ]
      },
      this.container.client.chatInputCommandsData.get(this.name)
    );
  }

  public async run({ author, guild, member, username, guest }: { author: User, guild: Guild, member: GuildMember, username?: string | null, guest?: boolean | null }): Promise<string> {
    if (!username && !guest) {
      return '❓ Se requiere un nombre de usuario de Fandom, o el flag `--guest` para verificar como invitado.';
    }

    const { client } = this.container;
    if (username) {
      try {
        const mwUser = await FandomUtilities.getUserInfo('comunidad', username);

        const { id } = member.user;
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
        client.logException(err);
        if (err instanceof Error) {
          return `❌ ${err instanceof NonExistentUser ? 'La cuenta de usuario especificada no existe.' : err.message}`;
        }
        return `❌ Ha ocurrido un error inesperado.`;
      }
    }

    const logsChannel = await guild.channels.fetch(env.LOGS_CHANNEL) as TextChannel;
    const rolesToAdd = username ? [env.USER_ROLE, env.FDUSER_ROLE] : [env.USER_ROLE];
    const logReason = `✅ <@!${author.id}> verificó a <@!${member.user.id}> ${
      username ? `con la cuenta de Fandom **${username}**` : 'como invitado'
    }`;

    await Promise.all([
      member.roles.add(
        rolesToAdd,
        `Verificado manualmente por ${author.tag}`
      ),
      member.roles.remove(env.NEWUSER_ROLE),
      logsChannel.send(logReason)
    ]).catch(client.logException);

    return `Verificación exitosa.`;
  }

  public async messageRun(message: Message, args: Args): Promise<void> {
    if (!message.guild) return;

    const targetUserMatch = await args.pickResult('member');
    if (!targetUserMatch.success) {
      void message.reply('❓ No encontré al usuario que buscas.');
      return;
    }
    const targetUser = targetUserMatch.value;
    const guestFlag = args.getFlags('guest');
    const fandomUserMatch = await args.restResult('string');

    const reply = await this.run({
      author: message.author,
      guild: message.guild,
      member: targetUser,
      guest: guestFlag,
      username: fandomUserMatch.value
    });
    void message.reply(reply);
  }

  public async chatInputRun(interaction: CommandInteraction<'present'>): Promise<void> {
    await interaction.deferReply();
    const user = interaction.options.getUser('miembro', true);
    const fandomUsername = interaction.options.getString('usuario');
    const guest = interaction.options.getBoolean('invitado');

    const guild = interaction.guild ?? await this.container.client.guilds.fetch(interaction.guildId);
    const member = await guild.members.fetch(user.id)
      .catch(() => null);

    if (!member) {
      void interaction.editReply(`El usuario no se encuentra en el servidor.`);
      return;
    }

    const reply = await this.run({
      author: interaction.user,
      guild,
      member,
      guest,
      username: fandomUsername
    });
    void interaction.editReply(reply);
  }
}

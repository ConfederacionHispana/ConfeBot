import { Command } from 'discord-akairo';
import { GuildMember, Message, Role } from 'discord.js';
import { stringSimilarity } from 'string-similarity-js';
import { env } from '../../environment';

class WikiSelfRolesCommand extends Command {
  constructor() {
    super('wikis', {
      aliases: ['wikis', 'wiki'],
      args: [
        {
          id: 'wikiNames',
          type: 'string',
          match: 'content'
        }
      ]
    });
  }

  exec(msg: Message, args: { wikiNames?: string }): void {
    if (!msg.guild || msg.guild.id !== env.GUILD_ID) return;
    if (!(msg.member instanceof GuildMember)) return;

    if (args.wikiNames) {
      const wikiNames = args.wikiNames.split(',');
      const guildRoles = msg.guild.roles.cache,
        wikiIndexRole = msg.guild.roles.resolve(env.WIKI_ROLE_GROUP) as Role,
        assignedRoles: Role[] = [];
      guildRoles.each((role) => {
        if (role.position >= wikiIndexRole.position) return;
        if (role.position === 0) return; // @everyone role
        wikiNames.forEach((wikiName: string) => {
          if (!wikiName) return;
          const similarityScore = stringSimilarity(wikiName, role.name);
          if (similarityScore > 0.70) {
            (msg.member as GuildMember).roles.add(role).catch(this.client.logException);
            assignedRoles.push(role);
          }
        });
      });
      if (assignedRoles.length) {
        msg.member.roles.add(env.WIKI_ROLE_GROUP).catch(this.client.logException);
        msg.reply(`✅ Roles añadidos: ${assignedRoles.map((role) => `**${role.name}**`).join(', ')}.`).catch(this.client.logException);
      } else msg.reply('⚠️ No encontré ningún rol de wiki similar a lo que has escrito. Revisa e intenta nuevamente.').catch(this.client.logException);
    } else {
      const guildRoles = msg.guild.roles.cache,
        wikiIndexRole = msg.guild.roles.resolve(env.WIKI_ROLE_GROUP) as Role,
        assignableRoles: Role[] = [];
      guildRoles.each((role) => {
        if (role.position >= wikiIndexRole.position) return;
        if (role.position === 0) return; // @everyone role
        assignableRoles.push(role);
      });
      msg.channel.send({
        embed: {
          title: 'Roles de wikis',
          color: 'RANDOM',
          description: `Roles de wikis asignables:\n\n${assignableRoles.map((role) => `• <@&${role.id}>`).join('\n')}`
        }
      }).catch(this.client.logException);
    }
  }
}

export default WikiSelfRolesCommand;

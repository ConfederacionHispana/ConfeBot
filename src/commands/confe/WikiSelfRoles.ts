import { ApplyOptions } from '@sapphire/decorators';
import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import { Args, Command } from '@sapphire/framework';
import { stringSimilarity } from 'string-similarity-js';
import { env } from '../../lib';

import type { PaginatedMessagePage } from '@sapphire/discord.js-utilities';
import type { CommandOptions } from '@sapphire/framework';
import type { Message, Role } from 'discord.js';

@ApplyOptions<CommandOptions>({
  aliases: ['wiki', 'wikis']
})
export class WikiSelfRolesCommand extends Command {
  public async messageRun(message: Message, args: Args): Promise<void> {
    if (!message.guild || message.guild.id !== env.GUILD_ID) return;
    if (!message.member) return;
    const { client } = this.container;
    const guildRoles = message.guild.roles.cache;
    const wikiIndexRole = message.guild.roles.resolve(env.WIKI_ROLE_GROUP) as Role;
    const assignableRoles: Role[] = Array.from(guildRoles.values())
      .filter((r) => r.editable && r.position < wikiIndexRole.position && r.position !== 0)
      .sort((a, b) => b.position - a.position);

    const wikiNamesResolver = Args.make((arg) => Args.ok(arg.split(',').map((arg) => arg.trim())));
    const wikiNames = await args.restResult(wikiNamesResolver);

    if (wikiNames.success) {
      const assignedRoles: Role[] = [];
      assignableRoles.forEach((role) => {
        wikiNames.value.forEach((wikiName: string) => {
          if (!wikiName) return;
          const similarityScore = stringSimilarity(wikiName, role.name);
          if (similarityScore >= 0.7) {
            message.member?.roles.add(role).catch(client.logException);
            assignedRoles.push(role);
          }
        });
      });

      if (assignedRoles.length) {
        message.member.roles.add(env.WIKI_ROLE_GROUP).catch(client.logException);
        message
          .reply(`✅ Roles añadidos: ${assignedRoles.map((role) => `**${role.name}**`).join(', ')}.`)
          .catch(client.logException);
      } else
        message
          .reply('⚠️ No encontré ningún rol de wiki similar a lo que has escrito. Revisa e intenta nuevamente.')
          .catch(client.logException);
    } else {
      const rolesPerPage = 20;

      const assignableRolesPages: Role[][] = new Array(Math.ceil(assignableRoles.length / rolesPerPage))
        .fill(null)
        .map((_) => assignableRoles.splice(0, rolesPerPage));

      const pages: PaginatedMessagePage[] = assignableRolesPages.map((roles, idx) => {
        return {
          embeds: [
            {
              title: 'Roles de wikis',
              color: roles[0].color,
              description: roles.map((role) => `• <@&${role.id}>`).join('\n'),
              footer: {
                text: `Página ${idx + 1} de ${assignableRolesPages.length}`
              }
            }
          ]
        };
      });

      const paginator = new PaginatedMessage();
      paginator.addPages(pages);
      paginator.run(message).catch(client.logException);
    }
  }
}

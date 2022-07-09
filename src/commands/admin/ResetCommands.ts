import { type ApplicationCommandRegistry, Command } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import type { CommandInteraction } from 'discord.js';
import type { CommandOptions } from '@sapphire/framework';
import { env } from '../../lib';

@ApplyOptions<CommandOptions>({
  description: 'Remove all application commands (manually restart after).',
  enabled: true,
  name: 'remove-commands'
})
export class UserCommand extends Command {
  public override async registerApplicationCommands(registry: ApplicationCommandRegistry): Promise<void> {
    registry.registerChatInputCommand(
      builder => builder
        .setName(this.name)
        .setDescription(this.description),
      {
        ...await this.container.stores.get('models').get('command')
          .getData(this.name),
        guildIds: [env.GUILD_ID]
      }
    );
  }

  public override async chatInputRun(interaction: CommandInteraction): Promise<void> {
    void interaction.reply('Eliminando todos los comandos...');
    await this.container.stores.get('models').get('command')
      .truncate();

    await this.container.client.application?.commands.set([]);
    const guilds = await this.container.client.guilds.fetch();
    for (const [_, guild] of guilds) { // eslint-disable-line @typescript-eslint/no_unused_vars
      const fetchGuild = await guild.fetch();
      const guildCommands = await fetchGuild.commands.fetch();
      if (guildCommands.size === 0) continue;
      await fetchGuild.commands.set([]);
    }

    await this.container.stores.get('commands').loadAll();
    void interaction.followUp('Los comandos han sido recargados.');
  }
}
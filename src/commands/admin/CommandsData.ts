import { type ApplicationCommandRegistry, Command } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { CommandInteraction, Permissions } from 'discord.js';
import type { CommandOptions } from '@sapphire/framework';
import { env } from '../../lib';

@ApplyOptions<CommandOptions>({
  description: 'Update the commands\'s ids in the database.',
  enabled: true,
  name: 'commands-data'
})
export class UserCommand extends Command {
  public override async registerApplicationCommands(registry: ApplicationCommandRegistry): Promise<void> {
    registry.registerChatInputCommand(
      builder => builder
        .setName(this.name)
        .setDescription(this.description)
        .setDefaultMemberPermissions(Permissions.FLAGS.MANAGE_GUILD),
      {
        ...await this.container.stores.get('models').get('command')
          .getData(this.name),
        guildIds: [env.GUILD_ID]
      }
    );
  }

  public override async chatInputRun(interaction: CommandInteraction): Promise<void> {
    await interaction.reply('Estoy procesando la información de los comandos actuales...');

    const models = this.container.stores.get('models');
    const commandsData = models.get('command');
    const commands = await this.container.client.application?.commands.fetch();
    for (const [id, command] of commands ?? []) {
      await commandsData.addIdHint(command.name, id);
    }
    const guilds = await this.container.client.guilds.fetch();
    for (const [_, guild] of guilds) { // eslint-disable-line @typescript-eslint/no-unused-vars
      const guildCommands = await (await guild.fetch()).commands.fetch();
      for (const [id, command] of guildCommands) {
        await commandsData.addIdHint(command.name, id);
      }
    }
  }
}
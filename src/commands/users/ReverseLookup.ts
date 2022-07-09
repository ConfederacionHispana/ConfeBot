import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, Command } from '@sapphire/framework';

import type { Args, CommandOptions } from '@sapphire/framework';
import type { CommandInteraction, Message, ReplyMessageOptions } from 'discord.js';

@ApplyOptions<CommandOptions>({
  aliases: ['reverselookup', 'finduser'],
  description: 'Encuentra a un usuario a partir de su nombre en Fandom',
  name: 'reverse-lookup'
})
export class ReverseLookupCommand extends Command {
  public override async registerApplicationCommands(registry: ApplicationCommandRegistry): Promise<void> {
    registry.registerChatInputCommand(
      builder => builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption(option => option
          .setName('usuario')
          .setDescription('Usuario a buscar')
          .setRequired(true)),
      await this.container.stores.get('models').get('command').getData(this.name)
    );
  }

  public async evaluate(username: string): Promise<string | ReplyMessageOptions> {
    const model = this.container.stores.get('models').get('user');
    const dbUser = await model.findUserByName(username)
      .catch(() => null);
    if (!dbUser) {
      return '❌ No se encontró un usuario de Discord que coincida con la cuenta especificada.';
    }
    return {
      embeds: [
        {
          title: 'Resultados de la búsqueda',
          color: 'RANDOM',
          description: `Se encontró el siguiente usuario de Discord para la cuenta de Fandom **${username}**:\n<@!${dbUser.id}>`
        }
      ]
    };
  }

  public async messageRun(message: Message, args: Args): Promise<void> {
    const username = await args.pick('string')
      .catch(() => null);
    if (!username) {
      void message.reply('❌ Debes ingresar un nombre de usuario para buscar.');
      return;
    }

    const reply = await this.evaluate(username);
    void message.reply(reply);
  }

  public async chatInputRun(interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply();
    const username = interaction.options.getString('usuario', true);
    const reply = await this.evaluate(username);
    void interaction.editReply(reply);
  }
}

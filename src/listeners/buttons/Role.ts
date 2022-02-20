import { ApplyOptions } from '@sapphire/decorators';
import { Constants } from 'discord.js';
import { getMemberRoles } from '../../lib';
import type { Interaction } from 'discord.js';
import { Listener } from '@sapphire/framework';
import type { ListenerOptions } from '@sapphire/framework';

@ApplyOptions<ListenerOptions>({
  event: Constants.Events.INTERACTION_CREATE
})
export class UserEvent extends Listener {
  public async run(interaction: Interaction) {
    if (!interaction.isButton() || !interaction.inGuild() || !interaction.customId.startsWith('role-')) return;
    const roleId = interaction.customId.split('-').pop();
    if (!roleId) return; // dumb check

    try {
      const roles = await getMemberRoles(interaction);
      let action: string;
      if (roles.cache.has(roleId)) {
        await roles.remove(roleId);
        action = 'removido';
      } else {
        await roles.add(roleId);
        action = 'añadido';
      }
      void interaction.reply({
        embeds: [{
          color: 0x1b5e20,
          description: `Se ha ${ action } el rol <@&${ roleId }> exitosamente.`,
        }],
        ephemeral: true
      });
    } catch {
      void interaction.reply({
        embeds: [{
          color: 0xb71c1c,
          description: 'Ha ocurrido un error al intentar actualizar tus roles. Intentalo de nuevo más tarde.',
        }],
        ephemeral: true
      });
    }
  }
}

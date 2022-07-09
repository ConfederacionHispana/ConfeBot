import type { Guild, Interaction } from 'discord.js';
import { container } from '@sapphire/framework';

// eslint-disable-next-line require-await
export const getInteractionGuild = async (interaction: Interaction): Promise<Guild> => {
  if (!interaction.guildId) throw new Error("Interaction was expected to come from a guild, but it doesn't have a guildId property.");
  return interaction.guild
		?? container.client.guilds.fetch(interaction.guildId);
};
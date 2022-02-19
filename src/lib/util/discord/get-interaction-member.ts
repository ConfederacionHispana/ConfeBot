import { getInteractionGuild } from './get-interaction-guild';
import { GuildMember } from 'discord.js';
import type { Interaction } from 'discord.js';

export const getInteractionMember = async (interaction: Interaction<'present'>): Promise<GuildMember> => {
  if (interaction.member instanceof GuildMember) return interaction.member;

  const guild = await getInteractionGuild(interaction);
  return guild.members.fetch(interaction.user.id);
};

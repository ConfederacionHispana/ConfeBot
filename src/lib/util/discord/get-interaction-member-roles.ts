import { getInteractionMember } from './get-interaction-member';
import type { GuildMemberRoleManager, Interaction } from 'discord.js';

export const getMemberRoles = async (interaction: Interaction<'present'>): Promise<GuildMemberRoleManager> => {
  if (!Array.isArray(interaction.member.roles)) {
    return interaction.member.roles;
  }
  const member = await getInteractionMember(interaction);
  return member.roles;
};

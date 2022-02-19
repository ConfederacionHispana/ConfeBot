import { getInteractionMember } from './get-interaction-member';
import type { Interaction } from 'discord.js';

export const getMemberRoles = async (interaction: Interaction<'present'>) => {
  if (!Array.isArray(interaction.member.roles)) {
    return interaction.member.roles;
  }
  const member = await getInteractionMember(interaction);
  return member.roles;
};

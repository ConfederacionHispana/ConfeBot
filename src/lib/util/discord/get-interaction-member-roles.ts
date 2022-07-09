import { getInteractionMember } from './get-interaction-member';
import type { GuildMemberRoleManager, Interaction } from 'discord.js';

export const getMemberRoles = async (interaction: Interaction): Promise<GuildMemberRoleManager> => {
  if (!interaction.member) throw new Error("Interaction was expected to come from a guild, but it doesn't have a member property.");
  if (!Array.isArray(interaction.member.roles)) {
    return interaction.member.roles;
  }
  const member = await getInteractionMember(interaction);
  return member.roles;
};

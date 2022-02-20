import type { AnyChannel, CommandInteraction, NewsChannel, TextChannel } from 'discord.js';
import { getInteractionGuild } from './get-interaction-guild';

export const getInteractionChannel = async (interaction: CommandInteraction<'present'>): Promise<NewsChannel | TextChannel | null> => {
  let { channel }: {
		channel: AnyChannel | null
	} = interaction;
  if (!channel) {
    const guild = await getInteractionGuild(interaction);
    const guildChannel = await guild.channels.fetch(interaction.guildId);
    channel = guildChannel;
  }
  if (channel?.type !== 'GUILD_TEXT' && channel?.type !== 'GUILD_NEWS') return null;
  return channel;
};

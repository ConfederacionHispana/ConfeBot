import Guild from '../models/Guild';

import type { ConfeBot } from '#lib/ConfeBot';

export class GuildStatsManager {
  public client: ConfeBot;

  constructor(client: ConfeBot) {
    this.client = client;
  }

  /**
   * Get a single stat value for a guild
   * @param guildId id of the guild
   * @param stat stat name
   * @returns current value of the stat
   */
  public async getGuildStat(guildId: string, stat: string): Promise<number> {
    const guild = (await Guild.findOne({ id: guildId })) || new Guild({ id: guildId });
    if (!guild) throw new Error('Guild not found');
    const stats = guild.stats || {};
    return stats[stat];
  }

  /**
   * Increment a stat value for a guild
   * @param guildId id of the guild
   * @param stat stat name
   * @returns new value of the stat
   */
  public async incrementGuildStat(guildId: string, stat: string): Promise<number> {
    const guild = (await Guild.findOne({ id: guildId })) || new Guild({ id: guildId });
    if (!guild) throw new Error('Guild not found');
    const stats = guild.stats || {};
    stats[stat] = stats[stat] ? stats[stat] + 1 : 1;
    guild.stats = stats;
    guild.markModified('stats');
    await guild.save();
    return stats[stat];
  }
}

import Guild from '../models/Guild';

import type { ConfeBot } from '../../lib';
import type { IGuild } from '../models/Guild';

export class GuildSettingsManager {
  public client: ConfeBot;

  constructor(client: ConfeBot) {
    this.client = client;
  }

  public async getGuildSettings(guildId: string): Promise<IGuild['settings']> {
    return (await Guild.findOne({ id: guildId }))?.settings || new Guild({ id: guildId }).settings;
  }

  public async setGuildSettings(guildId: string, settings: IGuild['settings']): Promise<void> {
    await Guild.findOneAndUpdate({ id: guildId }, { settings }, { upsert: true });
  }
}

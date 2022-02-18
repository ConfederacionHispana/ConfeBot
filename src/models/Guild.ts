import { ApplyOptions } from '@sapphire/decorators'
import { Model } from '../lib'
import type { PieceOptions } from '@sapphire/pieces'

export interface IGuild {
    id: string;
    settings?: {
      prefix?: string;
      channels?: {
        starboard?: string;
      };
    };
    stats?: {
      [key: string]: number;
    };
  }

@ApplyOptions<PieceOptions>( {
    name: 'guild'
} )
export class GuildModel extends Model {
    public getDefaultGuild( id: string ): IGuild {
        return {
            id,
            settings: {},
            stats: {}
        }
    }

    public async getGuild( guildId: string ): Promise<IGuild> {
        const collection = this.container.mongodb.collection<IGuild>( 'guilds' )
        const guild = await collection.findOne( { id: guildId } ) ?? this.getDefaultGuild( guildId )
        return guild
    }

    public async getChannel( guildId: string, name: 'starboard' ): Promise<string | null> {
        const guild = await this.getGuild( guildId )
        return guild.settings?.channels?.[ name ] ?? null
    }

    public async getPrefix( guildId: string ): Promise<string> {
        const guild = await this.getGuild( guildId )
        return guild.settings?.prefix ?? 'c!'
    }

    public async getStat( guildId: string, stat: string ): Promise<number> {
        const guild = await this.getGuild( guildId )
        return guild.stats?.[ stat ] ?? 0
    }

    public async setChannel( guildId: string, name: 'starboard', channel: string ): Promise<void> {
        const collection = this.container.mongodb.collection<IGuild>( 'guilds' )
        await collection.updateOne(
            { id: guildId },
            {
                $set: {
                    [ `settings.channels.${ name }` ]: channel
                }
            },
            { upsert: true }
        )
    }

    public async setPrefix( guildId: string, prefix: string ): Promise<void> {
        const collection = this.container.mongodb.collection<IGuild>( 'guilds' )
        await collection.updateOne(
            { id: guildId },
            {
                $set: {
                    'settings.prefix': prefix
                }
            },
            { upsert: true }
        )
    }

    public async addStat( guildId: string, stat: string ): Promise<void> {
        const collection = this.container.mongodb.collection<IGuild>( 'guilds' )
        await collection.updateOne(
            { id: guildId },
            {
                $inc: {
                    [ `stats.${ stat }` ]: 1
                }
            },
            { upsert: true }
        )
    }
}

declare global {
    interface ModelRegistryEntries {
        guild: GuildModel
    }
}
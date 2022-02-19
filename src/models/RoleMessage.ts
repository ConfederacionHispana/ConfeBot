import { ApplyOptions } from '@sapphire/decorators';
import { Model } from '../lib';
import type { PieceOptions } from '@sapphire/pieces';

export interface IRoleMessage {
    channel: string
	guild: string
    message: string
}

@ApplyOptions<PieceOptions>({
  name: 'role-message'
})
export class RoleMessageModel extends Model {
  public async create(document: IRoleMessage): Promise<void> {
    const collection = this.container.mongodb.collection<IRoleMessage>('rolemessages');
    await collection.insertOne(document);
  }
    
  public async get(message: string): Promise<IRoleMessage | null> {
    const collection = this.container.mongodb.collection<IRoleMessage>('rolemessages');
    return collection.findOne({ message });
  }

  public async getProperty(message: string, property: 'channel' | 'guild'): Promise<string | null> {
    const doc = await this.get(message);
    return doc?.[property] ?? null; // sí sí, lgtm, ya te vimos que no sabes typescript
  }
    
  public getChannel(message: string): Promise<string | null> {
    return this.getProperty(message, 'channel');
  }

  public async getGuild(message: string): Promise<string | null> {
    return this.getProperty(message, 'guild');
  }
}

declare global {
    interface ModelRegistryEntries {
        'role-message': RoleMessageModel
    }
}

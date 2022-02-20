import { ApplyOptions } from '@sapphire/decorators';
import { Model } from '../lib';
import type { PieceOptions } from '@sapphire/pieces';

export interface IKeyV {
	guild: string
	key: string
	value: string
}


@ApplyOptions<PieceOptions>({
  name: 'keyv'
})
export class KeyVModel extends Model {
  public async set(guild: string, key: string, value: string): Promise<void> {
    const collection = this.container.mongodb.collection<IKeyV>('keyv');
    await collection.findOneAndUpdate(
      { guild, key },
      { $set: { value } },
      { upsert: true }
    );
  }
  
  public async get(guild: string, key: string): Promise<string | null> {
    const collection = this.container.mongodb.collection<IKeyV>('keyv');
    const document = await collection.findOne({ guild, key });
    return document?.value ?? null;
  }
}

declare global {
    interface ModelRegistryEntries {
        keyv: KeyVModel
    }
}

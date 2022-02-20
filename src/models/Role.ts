import { ApplyOptions } from '@sapphire/decorators';
import { Model } from '../lib';
import type { PieceOptions } from '@sapphire/pieces';

export interface IRole {
    creation: Date
	emoji?: string
	label?: string
	message: string
	role: string
}

@ApplyOptions<PieceOptions>({
  name: 'role'
})
export class RoleModel extends Model {
  public async create(document: IRole): Promise<void> {
    const collection = this.container.mongodb.collection<IRole>('roles');
    await collection.insertOne(document);
  }

  public async delete(message: string, role: string): Promise<void> {
    const collection = this.container.mongodb.collection<IRole>('roles');
    await collection.findOneAndDelete({ message, role });
  }

  public countRolesInMessage(message: string): Promise<number> {
    const collection = this.container.mongodb.collection<IRole>('roles');
    return collection.countDocuments({ message });
  }
    
  public getMessageRoles(message: string): Promise<IRole[]> {
    const collection = this.container.mongodb.collection<IRole>('roles');
    return collection.find({ message }).sort({ creation: 1 }).toArray();
  }

  public async isSet(message: string, role: string): Promise<boolean> {
    const collection = this.container.mongodb.collection<IRole>('roles');
    const document = await collection.findOne({ message, role });
    return document ? true : false;
  }
}

declare global {
    interface ModelRegistryEntries {
        'role': RoleModel
    }
}

import { ApplyOptions } from '@sapphire/decorators';
import { Model } from '../lib';
import type { PieceOptions } from '@sapphire/pieces';

export interface IUser {
    id: string;
    fandomUser: {
      username: string;
      userId: number;
      verifiedAt: Date;
    };
    serverEvents: {
      date: Date;
      event: string;
    }[];
    fandomAccountEvents: {
      date: Date;
      event: string;
      account: {
        username: string;
        userId: number;
      };
    }[];
  }


@ApplyOptions<PieceOptions>({
  name: 'user'
})
export class UserModel extends Model {
  public async create(user: IUser): Promise<void> {
    const collection = this.container.mongodb.collection<IUser>('users');
    await collection.findOneAndReplace(
      { id: user.id },
      user,
      { upsert: true }
    );
  }

  public async findUserByName(username: string): Promise<IUser | null> {
    const collection = this.container.mongodb.collection<IUser>('users');
    return collection.findOne({ 'fandomUser.username': username });
  }

  public async findUserBySnowflake(snowflake: string): Promise<IUser | null> {
    const collection = this.container.mongodb.collection<IUser>('users');
    return collection.findOne({ id: snowflake });
  }

  public getDefaultUser(snowflake: string): IUser {
    return {
      id: snowflake,
      fandomUser: {
        username: '',
        userId: 0,
        verifiedAt: new Date()
      },
      serverEvents: [],
      fandomAccountEvents: []
    };
  }
}

declare global {
    interface ModelRegistryEntries {
        user: UserModel
    }
}

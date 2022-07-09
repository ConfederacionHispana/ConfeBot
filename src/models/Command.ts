import { ApplyOptions } from '@sapphire/decorators';
import { env, Model } from '../lib';
import type { PieceOptions } from '@sapphire/pieces';
import { ApplicationCommandRegistry, RegisterBehavior } from '@sapphire/framework';
import { DeleteResult } from 'mongodb';

export interface ICommand {
	entryType: 'guild' | 'idHint'
	name: string
	value: string
}

@ApplyOptions<PieceOptions>({
  name: 'command'
})
export class CommandModel extends Model {
  public async addIdHint(command: string, idHint: string): Promise<boolean> {
    const options = { entryType: 'idHint', name: command, value: idHint } as const;
    const collection = this.container.mongodb.collection<ICommand>('commands');
    const exists = await collection.findOne(options);
    if (exists) return false;
    await collection.insertOne(options);
    return true;
  }

  public async addGuild(command: string, guild: string): Promise<boolean | null> {
    const options = { entryType: 'guild', name: command, value: guild } as const;
    const collection = this.container.mongodb.collection<ICommand>('commands');
    const exists = await collection.findOne(options);
    if (exists) return false;
    await collection.insertOne(options);
    return true;
  }

  public async getData(command: string): Promise<ApplicationCommandRegistry.RegisterOptions> {
    const collection = this.container.mongodb.collection<ICommand>('commands');
    const rows = await collection.find({ name: command }).toArray();
    const data: ApplicationCommandRegistry.RegisterOptions = {
      behaviorWhenNotIdentical: RegisterBehavior.Overwrite
    };
    if (env.NODE_ENV === 'development') {
      data.guildIds = [env.GUILD_ID];
    }

    rows.reduce((collection, item) => {
      if (item.entryType === 'guild') {
        const guilds = collection.guildIds ?? [];
        guilds.push(item.value);
        collection.guildIds ??= guilds;
      } else {
        const hints = collection.idHints ?? [];
        hints.push(item.value);
        collection.idHints ??= hints;
      }
      return collection;
    }, data);
    return data;
  }

  public removeGuild(command: string, guild: string): Promise<DeleteResult> {
    const collection = this.container.mongodb.collection<ICommand>('commands');
    return collection.deleteOne({ entryType: 'guild', name: command, value: guild });
  }

  public truncate(): Promise<boolean> {
    const collection = this.container.mongodb.collection<ICommand>('commands');
    return collection.drop();
  }
}

declare global {
    interface ModelRegistryEntries {
        command: CommandModel
    }
}

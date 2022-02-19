import type { ApplicationCommandRegistry } from '@sapphire/framework';
import { env } from '../env';
import fs from 'fs-extra';
import path from 'path';
import { RegisterBehavior } from '@sapphire/framework';

export class ChatInputCommandsData {
  public readonly chatInputCommandsRegisterOptions: Record<string, Pick<ApplicationCommandRegistry.RegisterOptions, 'guildIds' | 'idHints'>> = {};

  public readonly chatInputCommandDefaultOptions = {
    behaviorWhenNotIdentical: RegisterBehavior.LogToConsole,
    guildIds: env.NODE_ENV === 'development' ? [env.GUILD_ID] : [],
    register: true
  } as const;

  public readonly filepath: string;

  public constructor(filepath?: string) {
    this.filepath = filepath ?? path.resolve(__dirname, '../../../slash-settings.json');

    if (env.NODE_ENV === 'development' && fs.existsSync(this.filepath)) {
      try {
        this.chatInputCommandsRegisterOptions = fs.readJsonSync(this.filepath) as typeof this[ 'chatInputCommandsRegisterOptions' ];
      } catch {
        // eslint-disable-line no-empty
      }
    }
  }

  public get(name: string): ApplicationCommandRegistry.RegisterOptions {
    const options = this.chatInputCommandsRegisterOptions[ name ] ?? {};
    return {
      ...this.chatInputCommandDefaultOptions,
      ...options
    };
  }

  public addGuildId(name: string, guild: string): void {
    this.setProperty(name, 'guildIds', guild);
  }

  public addIdHint(name: string, id: string): void {
    this.setProperty(name, 'idHints', id);
  }

  public save(): void {
    if (env.NODE_ENV !== 'development') return;

    fs.writeJsonSync(this.filepath, this.chatInputCommandsRegisterOptions, {
      spaces: '\t'
    });
  }

  protected setProperty(name: string, property: 'guildIds' | 'idHints', value: string): void {
    const options = this.chatInputCommandsRegisterOptions[ name ] ?? {};
    const array = options[ property ] ?? [];
    if (array.includes(value)) return;
    array.push(value);
    if (!options[ property ]) options[ property ] = array;
    if (!this.chatInputCommandsRegisterOptions[ name ]) this.chatInputCommandsRegisterOptions[ name ] = options;
  }
}

import type { TaskStore } from '#lib/structures/TaskStore';
import type { GuildSettingsManager } from '../db/managers/GuildSettingsManager';
import type { GuildStatsManager } from 'db/managers/GuildStatsManager';
import type { Db } from 'mongodb';

declare module '@sapphire/framework' {
  interface ILogger {
    log(...values: readonly unknown[]): void;
  }
}

declare module '@sapphire/pieces' {
  interface Container {
    mongodb: Db;
    settingsManager: GuildSettingsManager;
    statsManager: GuildStatsManager;
  }
}

declare module 'discord.js' {
  interface Client {
    // set during the 'ready' event
    cache: {
      widgetInvite: {
        code: string;
        uses: number;
      };
    };
    readonly version: string;
    logException(err: Error, context?: Record<string, unknown>): void;
  }
}

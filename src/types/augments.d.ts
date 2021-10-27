import type { TaskStore } from '#lib/structures/TaskStore';
import type { GuildSettingsManager } from '../db/managers/GuildSettingsManager';
import type { GuildStatsManager } from 'db/managers/GuildStatsManager';

declare module '@sapphire/framework' {
  interface ILogger {
    log(...values: readonly unknown[]): void;
  }
}

declare module '@sapphire/pieces' {
  interface Container {
    settingsManager: GuildSettingsManager;
    statsManager: GuildStatsManager;
  }
  interface StoreRegistryEntries {
    tasks: TaskStore;
  }
}

declare module 'discord.js' {
  interface Client {
    logException(err: Error, context?: Record<string, unknown>): void;
    readonly version: string;
    // set during the 'ready' event
    cache: {
      widgetInvite: {
        code: string;
        uses: number;
      };
    };
  }
}

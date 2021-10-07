import type { TaskStore } from '#lib/structures/TaskStore';

declare module '@sapphire/framework' {
  interface ILogger {
    log( ...values: readonly unknown[] ): void;
  }
}

declare module '@sapphire/pieces' {
  interface StoreRegistryEntries {
    tasks: TaskStore;
  }
}

declare module 'discord.js' {
  interface Client {
    logException( err: Error, context?: Record<string, unknown>): void;
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

import type { Db } from 'mongodb';

declare module '@sapphire/framework' {
  interface ILogger {
    log(...values: readonly unknown[]): void;
  }
}

declare module '@sapphire/pieces' {
  interface Container {
    mongodb: Db;
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
		applicationCommandsGuilds: string[]
    readonly version: string;
    logException(err: Error, context?: Record<string, unknown>): void;
  }
}

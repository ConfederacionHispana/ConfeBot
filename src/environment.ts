import { resolve } from 'path';
import { EnvType, load } from 'ts-dotenv';

export type Env = EnvType<typeof schema>;

export const schema = {
  DISCORD_TOKEN: String,
  ROLLBAR_TOKEN: String,
  OWNER_ID: String,

  MW_API: String,

  GUILD_ID: String
};

// eslint-disable-next-line import/no-mutable-exports
export let env: Env;

export function loadEnv(): void {
  env = load(schema, {
    path: resolve('../.env')
  });
}

import { resolve } from 'path';
import { EnvType, load } from 'ts-dotenv';

export type Env = EnvType<typeof schema>;

export const schema = {
  DISCORD_TOKEN: String,
  LOGZIO_TOKEN: {
    type: String,
    optional: true
  },
  SYSLOG_CHANNEL: String,
  OWNER_ID: String,

  MW_API: String,

  GUILD_ID: String,

  WELCOME_CHANNEL: String,
  VERIF_CHANNEL: String,
  LOGS_CHANNEL: String,
  SELFROLES_CHANNEL: String,

  NEWUSER_ROLE: String,
  USER_ROLE: String,
  FDUSER_ROLE: String,
  STAFF_ROLE: String,
  WIKI_ROLE_GROUP: String
};

// eslint-disable-next-line import/no-mutable-exports
export let env: Env;

export function loadEnv(): void {
  env = load(schema, {
    path: resolve('../.env')
  });
}

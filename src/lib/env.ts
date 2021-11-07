import { EnvType, load } from 'ts-dotenv';

export type Env = EnvType<typeof schema>;

export const schema = {
  DB_URI: String,
  DISCORD_TOKEN: String,
  HONEYBADGER_API_KEY: {
    type: String,
    optional: true
  },
  OWNER_ID: String,
  NODE_ENV: {
    type: String,
    default: 'development',
    optional: true
  },
  MW_API: String,

  // TODO: these should be stored in the database instead
  GUILD_ID: String,
  GUILD_INVITE: String,

  WELCOME_CHANNEL: String,
  VERIF_CHANNEL: String,
  LOGS_CHANNEL: String,
  SELFROLES_CHANNEL: String,
  REPORTS_CHANNEL: String,

  NEWUSER_ROLE: String,
  USER_ROLE: String,
  FDUSER_ROLE: String,
  HELPER_ROLE: String,
  STAFF_ROLE: String,
  SEGURIDAD_ROLE: String,
  WIKI_ROLE_GROUP: String,
  COUNTRY_ROLE_GROUP: String
};

export let env: Env;

export function loadEnv(): void {
  env = load(schema);
}

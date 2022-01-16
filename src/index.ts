import mongoose from 'mongoose';
import { ConfeBot } from './lib/ConfeBot';
import { env, loadEnv } from '#lib/env';

let client: ConfeBot;

(async () => {
  loadEnv();
  client = new ConfeBot({
    baseUserDirectory: __dirname
  });
  client.logger.info(`ConfeBot v${client.version} is starting`);
  client.logger.info('Environment', env);
  await mongoose.connect(env.DB_URI);
  await client.login(env.DISCORD_TOKEN);
})().catch((err) => {
  client.logException(err);
  process.exit(1);
});

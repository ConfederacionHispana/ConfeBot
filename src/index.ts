import { ConfeBot, env, loadEnv } from './lib';

let client: ConfeBot;

(async () => {
  loadEnv();
  client = new ConfeBot({
    baseUserDirectory: __dirname
  });
  client.logger.info(`ConfeBot v${client.version} is starting`);
  client.logger.info('Environment', env);
  await client.login(env.DISCORD_TOKEN);
})().catch((err) => {
  if (client) client.logException(err);
  else console.error(err); // eslint-disable-line no-console
  process.exit(1);
});

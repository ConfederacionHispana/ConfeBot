import { ConfeBot } from './lib/ConfeBot';
import { env, loadEnv } from '#lib/env';

const client = new ConfeBot({
  baseUserDirectory: __dirname
});

const main = async () => {
  try {
    loadEnv();
    client.logger.info(`ConfeBot v${client.version} is starting`);
    client.logger.info('Environment', env);
    await client.login(env.DISCORD_TOKEN);
  } catch (err) {
    client.logException(err);
    process.exit(1);
  }
};

main().catch(client.logException);

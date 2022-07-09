import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';
import { env } from '../lib/env';

export class AutoVerifyTask extends ScheduledTask {
  public async run(payload: { userId: string }): Promise<void> {
    const { client, logger } = this.container;
    const { userId } = payload;

    try {
      const guild = client.guilds.resolve(env.GUILD_ID);
      const member = guild?.members.resolve(userId);

      if (!member) {
        logger.info('Member not found', {
          userId,
          source: 'AutoVerify'
        });
        return;
      }

      await member.roles.add(env.USER_ROLE);
      await member.roles.remove(env.NEWUSER_ROLE);

      logger.info('Member verified', {
        userId,
        source: 'AutoVerify'
      });
    } catch (err) {
      if (err instanceof Error) {
        logger.error(`AutoVerify failed: ${err.message}`);
        client.logException(err);
      }
    }
  }
}

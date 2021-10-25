import { ApplyOptions } from '@sapphire/decorators';
import { parse } from 'lua-json';
import { Fandom } from 'mw.js';

import User from '../db/models/User';
import { Task } from '#lib/structures/Task';
import { env } from '#lib/env';

import type { TextBasedChannels } from 'discord.js';
import type { TaskOptions } from '#lib/structures/Task';

@ApplyOptions<TaskOptions>({
  enabled: true,
  fireOnStart: true,
  schedule: '0 0 3 * * *'
})
export class BirthdayNotifications extends Task {
  public async run(): Promise<void> {
    const { client } = this.container;
    client.logger.info(`Running task: ${this.constructor.name}`);

    try {
      const birthdaysChannel = client.channels.cache.get(env.LOGS_CHANNEL) as TextBasedChannels;
      const wiki = new Fandom().getWiki('es.confederacion-hispana');

      const wikiResponse = await wiki.getPages('Módulo:Calendario de Cumpleaños/data');
      const birthdaysData = parse(wikiResponse) as Record<string, Record<string, string[]>>;
      const currentMonth = new Date().getMonth() + 1;
      const currentMonthBirthdays = birthdaysData[currentMonth.toString()];

      client.logger.info('CUMpleaños de este mes: ', currentMonthBirthdays);

      const todayBirthdays = currentMonthBirthdays?.[`${new Date().getDate()}`];

      if (todayBirthdays?.length) {
        for (const user of todayBirthdays) {
          const discordUser = await User.findOne({
            'fandomUser.username': user
          });

          if (discordUser) {
            await birthdaysChannel.send(
              `🎂 **¡Hoy es el cumpleaños de <@!${discordUser.id}>, envíenle felicitaciones!**`
            );
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        client.logException(error);
      }
    }
  }
}

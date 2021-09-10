import { ApplyOptions } from '@sapphire/decorators/dist/piece-decorators';
import { CronJob } from 'cron';

import { Task } from '#lib/structures/Task';
import { env } from '#lib/env';
import Vigilancia from '#lib/confe/Vigilancia';
import FandomUtilities from '#lib/fandom/FandomUtilities';

import type { PieceOptions } from '@sapphire/pieces';

@ApplyOptions<PieceOptions>({ enabled: true })
export class DailyReports extends Task {
  public async run(): Promise<void> {
    const { client } = this.context;

    const todayCalendar = await Vigilancia.getTodaysCalendar();
    const channel = client.channels.resolve(env.REPORTS_CHANNEL);
    if (!channel?.isText()) {
      client.logger.error("Couldn't find a reports channel.");
      return;
    }
    for (const username in todayCalendar) {
      const avatar = await FandomUtilities.getUserAvatar(username);
      const embed = await Vigilancia.customUserEmbed(username, avatar);
      embed.setDescription(
        'He revisado las siguientes comunidades para buscar ediciones realizadas desde su último patrullaje. **Se ignoran ediciones de la administración del respectivo wiki.**'
      );

      const wikis = todayCalendar[username];
      for (const interwiki of wikis) {
        const url = FandomUtilities.interwiki2url(interwiki);
        // eslint-disable-next-line @typescript-eslint/unbound-method
        const report = await Vigilancia.checkWiki(interwiki).catch(client.logger.error);
        if (!report) {
          embed.addField('❗ Wiki no encontrado', `No he podido encontrar ningún wiki para **${interwiki}**.`);
        } else if (report.users.length === 0) {
          embed.addField(
            `✅ ${report.sitename}`,
            `**Enlace:** <${url}>\n**Último patrullaje:** ${report.ago}.\nNo parece que haya habido actividad recientemente.`
          );
        } else {
          embed.addField(
            `❌ ${report.sitename}`,
            `**Enlace:** <${url}>\n**Último patrullaje:** ${report.ago}.\n**Editores encontrados:** ${report.users.join(
              ', '
            )}`.substring(0, 1000)
          );
        }
      }
      await channel.send(embed);
    }
  }

  public create(): CronJob {
    return new CronJob('0 0 3 * * *', () => this.run(), null, true);
  }
}

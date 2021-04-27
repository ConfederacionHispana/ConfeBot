import { AkairoClient } from 'discord-akairo';
import fetch from 'node-fetch';
import { env, loadEnv } from '../environment';
import FandomUtilities from '../packages/seguridad/FandomUtilities';
import Vigilancia from '../packages/seguridad/Vigilancia';

loadEnv();

const getUserAvatar = async (username: string): Promise<string> => {
  const red = await fetch(`https://confederacion-hispana.fandom.com/es/api/v1/User/Details?ids=${username}`);
  const res = await red.json();
  const avatar = `${res.items[0].avatar.split('/thumbnail')[0]}?format=png`;
  return avatar;
};

const DailyReports = async (client: AkairoClient): Promise<void> => {
  const todayCalendar = await Vigilancia.getTodaysCalendar();
  const channel = client.channels.resolve(env.REPORTS_CHANNEL);
  if (!channel?.isText()) {
    client.logger.error('Couldn\'t find a reports channel.');
    return;
  }
  for (const username in todayCalendar) {
    const avatar = await getUserAvatar(username);
    const embed = await Vigilancia.customUserEmbed(username, avatar);
    embed.setDescription('He revisado las siguientes comunidades para buscar ediciones realizadas desde su último patrullaje. **Se ignoran ediciones de la administración del respectivo wiki.**');

    const wikis = todayCalendar[username];
    for (const interwiki of wikis) {
      const url = FandomUtilities.interwiki2url(interwiki);
      const report = await Vigilancia.checkWiki(interwiki)
        .catch(client.logger.error);
      if (!report) {
        embed.addField(
          '❗ Wiki no encontrado',
          `No he podido encontrar ningún wiki para **${interwiki}**.`
        );
      } else if (report.users.length === 0) {
        embed.addField(
          `✅ ${report.sitename}`,
          `**Enlace:** <${url}>\n**Último patrullaje:** ${report.ago}.\nNo parece que haya habido actividad recientemente.`
        );
      } else {
        embed.addField(
          `❌ ${report.sitename}`,
          `**Enlace:** <${url}>\n**Último patrullaje:** ${report.ago}.\n**Editores encontrados:** ${report.users.join(', ')}`.substring(0, 1000)
        );
      }
    }
    await channel.send(embed);
  }
};

export default DailyReports;

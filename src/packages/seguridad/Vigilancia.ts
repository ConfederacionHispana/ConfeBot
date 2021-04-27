import { MessageEmbed } from 'discord.js';
import fetch from 'node-fetch';
import { format, formatDistance } from 'date-fns';
import { es } from 'date-fns/locale';
// @ts-ignore
import { getColorFromURL } from 'color-thief-node';
import FandomUtilities from './FandomUtilities';
import DBModels from '../../database';

type Day = 'lunes' | 'martes' | 'miércoles' | 'jueves' | 'viernes' | 'sábado' | 'domingo';
type ICalendar = {
  [username: string]: Record<Day, string[]>
};

interface IWiki {
  interwiki: string;
  ago: string;
  users: string[];
  sitename: string;
}

class Vigilancia {
  static readonly CALENDAR_URL = 'https://confederacion-hispana.fandom.com/es/wiki/MediaWiki:Custom-vigilancia.json?action=raw&ctype=application/json';

  static readonly WIKIS_LIST = 'https://comunidad.fandom.com/wiki/Lista_de_comunidades?action=raw&ctype=text/css';

  static async checkWiki(interwiki: string): Promise<IWiki> {
    const document = await DBModels.Vigilancia.findOne({
      interwiki
    }) || new DBModels.Vigilancia({ interwiki });
    const sitename = await FandomUtilities.getSitename(interwiki);
    const recentChanges = await FandomUtilities.getRecentChanges(interwiki, document.lastCheck);
    const rcusers = recentChanges.map((i) => i.user);
    const users = [...new Set(rcusers)];
    const ago = document.lastCheck
      ? formatDistance(document.lastCheck, Date.now(), {
        locale: es,
        addSuffix: true
      })
      : 'hace 7 días';

    document.lastCheck = Date.now();
    await document.save();
    return {
      interwiki,
      ago,
      users,
      sitename
    };
  }

  static async customUserEmbed(name: string, avatarURL?: string): Promise<MessageEmbed> {
    const colorRGB: number[] = await getColorFromURL(avatarURL);
    const colorHex = colorRGB.map((i) => i.toString(16)).join('');
    const color = parseInt(colorHex, 16);
    const embed = new MessageEmbed({
      title: name,
      color,
      thumbnail: {
        url: avatarURL
      }
    });

    return embed;
  }

  static async getCalendar(): Promise<ICalendar> {
    const req = await fetch(Vigilancia.CALENDAR_URL);
    const res = await req.json();
    return res;
  }

  // Get a list of wikis that are already in the calendar
  static async getConfederateWikis(): Promise<Set<string>> {
    const calendar = await Vigilancia.getCalendar();
    const wikis = new Set<string>();
    for (const username in calendar) {
      const wikisByUser = calendar[username];
      for (const interwikis of Object.values(wikisByUser)) for (const interwiki of interwikis) wikis.add(interwiki);
    }
    return wikis;
  }

  static async getTodaysCalendar(): Promise<Record<string, string[]>> {
    const result: Record<string, string[]> = {};
    const calendar = await Vigilancia.getCalendar();
    for (const username in calendar) {
      const wikisByUser = calendar[username];
      const todayWikis = wikisByUser[Vigilancia.today()];
      result[username] = todayWikis;
    }
    return result;
  }

  static async sample(_qty = 4): Promise<IWiki[]> {
    let qty = _qty;
    if (qty <= 0 || qty > 10) qty = 4;

    const confederates = await Vigilancia.getConfederateWikis();

    const req = await fetch(Vigilancia.WIKIS_LIST);
    const res = await req.text();
    const interwikis = [...res.matchAll(/w:c:(.*?)\|/g)].map((i) => i[1]);

    const wikis: IWiki[] = [];
    while (wikis.length < qty && interwikis.length !== 0) {
      const index = Math.floor(Math.random() * interwikis.length);
      const interwiki = interwikis[index];
      interwikis.splice(index, 1);
      if (confederates.has(interwiki)) continue;

      const report = await Vigilancia.checkWiki(interwiki).catch(() => {});
      if (!report || report.users.length === 0) continue;

      wikis.push(report);
    }
    return wikis;
  }

  static today(): Day {
    return format(Date.now(), 'EEEE', { locale: es }) as Day;
  }
}

export default Vigilancia;

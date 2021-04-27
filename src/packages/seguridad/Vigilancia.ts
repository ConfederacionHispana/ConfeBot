import fetch from 'node-fetch';
import { formatDistance } from 'date-fns';
import { es } from 'date-fns/locale';
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
    });
    const sitename = await FandomUtilities.getSitename(interwiki);
    const recentChanges = await FandomUtilities.getRecentChanges(interwiki);
    const users = recentChanges.map((i) => i.user);
    const ago = document?.lastCheck
      ? formatDistance(document.lastCheck, Date.now(), {
        locale: es,
        addSuffix: true
      })
      : 'hace 7 días';
    return {
      interwiki,
      ago,
      users,
      sitename
    };
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

      const report = await Vigilancia.checkWiki(interwiki);
      if (report.users.length === 0) continue;

      wikis.push(report);
    }
    return wikis;
  }
}

export default Vigilancia;

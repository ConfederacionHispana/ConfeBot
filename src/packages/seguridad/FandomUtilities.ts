import fetch from 'node-fetch';

import InexistentWiki from './errors/InexistentWiki';
import InvalidInterwiki from './errors/InvalidInterwiki';

interface IAllUsersQuery {
  query: {
    allusers: {
      userid: number
      name: string
    }[]
  }
}

interface IRecentChangesEntry {
  type: string
  ns: number
  title: string
  user: string
  oldlen: number
  newlen: number
}

interface IRecentChangesQuery {
  query: {
    recentchanges: IRecentChangesEntry[]
  }
}

export default class FandomUtilities {
  static interwiki2url(_interwiki: string): string {
    const interwiki = _interwiki.toLowerCase();
    if (interwiki.match(/[a-z0-9-]+\.[a-z0-9-]+/)) {
      const [lang, wikiname] = interwiki.split('.');
      return `https://${wikiname}.fandom.com/${lang}`;
    } if (interwiki.match(/^[a-z0-9-]+$/)) return `https://${interwiki}.fandom.com`;

    throw new InvalidInterwiki(interwiki);
  }

  static interwiki2api(interwiki: string): string {
    const url = FandomUtilities.interwiki2url(interwiki);
    return `${url}/api.php`;
  }

  static async getSitename(interwiki: string): Promise<string> {
    const api = FandomUtilities.interwiki2api(interwiki);
    const req = await fetch(`${api}?action=query&meta=siteinfo&siprop=general&format=json`);
    if (req.status === 404) throw new InexistentWiki(interwiki);
    const res = await req.json();
    return res.query.general.sitename;
  }

  static async getAdmins(interwiki: string): Promise<string[]> {
    const api = FandomUtilities.interwiki2api(interwiki);
    const req = await fetch(`${api}?action=query&list=allusers&format=json&augroup=sysop`);
    const res: IAllUsersQuery = await req.json();
    return res.query.allusers.map((i) => i.name);
  }

  static async getRecentChanges(
    interwiki: string,
    since: number = Date.now() - 604800000
  ): Promise<IRecentChangesEntry[]> {
    const api = FandomUtilities.interwiki2api(interwiki);
    const rcend = new Date(since).toISOString();
    const req = await fetch(`${api}?action=query&list=recentchanges&format=json&rcprop=title|sizes|user&rclimit=max&rcend=${rcend}`);
    const res: IRecentChangesQuery = await req.json();
    // Exclude admins
    const admins = await FandomUtilities.getAdmins(interwiki);
    return res.query.recentchanges.filter((i) => !admins.includes(i.user));
  }
}

import axios from 'axios';

import InvalidInterwiki from '#lib/util/errors/InvalidInterwiki';
import NonExistentUser from '#lib/util/errors/NonExistentUser';
import NonExistentWiki from '#lib/util/errors/NonExistentWiki';

interface IAllUsersQuery {
  query: {
    allusers: IMediaWikiUser[];
  };
}

interface IRecentChangesQuery {
  query: {
    recentchanges: IRecentChangesEntry[];
  };
}

interface IUsersQuery {
  query: {
    users: IMediaWikiUser[];
  };
  error?: Record<string, unknown>;
}

interface IRecentChangesEntry {
  type: string;
  ns: number;
  title: string;
  user: string;
  oldlen: number;
  newlen: number;
}

interface IMediaWikiUser {
  userid: number;
  name: string;
  registration: string;
  groups?: string[];
  implicitgroups?: string[];
  blockid?: number;
  blockedby?: string;
  blockedbyid?: number;
  blockedtimestamp?: string;
  blockreason?: string;
  blockexpiry?: string;
  missing?: string;
}

export default class FandomUtilities {
  static interwiki2url(_interwiki: string): string {
    const interwiki = _interwiki.toLowerCase();
    if (interwiki.match(/[a-z0-9-]+\.[a-z0-9-]+/)) {
      const [lang, wikiname] = interwiki.split('.');
      return `https://${wikiname}.fandom.com/${lang}`;
    }
    if (interwiki.match(/^[a-z0-9-]+$/)) return `https://${interwiki}.fandom.com`;

    throw new InvalidInterwiki(interwiki);
  }

  static interwiki2api(interwiki: string): string {
    const url = this.interwiki2url(interwiki);
    return `${url}/api.php`;
  }

  static async apiQuery(interwiki: string, params: Record<string, unknown>) {
    const api = this.interwiki2api(interwiki);
    const res = await axios.get(api, {
      params: {
        ...{
          action: 'query',
          format: 'json'
        },
        ...params
      }
    });
    if (res.status === 404) throw new NonExistentWiki(interwiki);
    return res.data;
  }

  static async getSitename(interwiki: string): Promise<string> {
    const result = await this.apiQuery(interwiki, {
      meta: 'siteinfo',
      siprop: 'general'
    });
    return result.query.general.sitename;
  }

  static async getAdmins(interwiki: string): Promise<string[]> {
    const result: IAllUsersQuery = await this.apiQuery(interwiki, {
      list: 'allusers',
      augroup: 'sysop'
    });
    return result.query.allusers.map((i) => i.name);
  }

  static async getRecentChanges(
    interwiki: string,
    since: number = Date.now() - 604800000
  ): Promise<IRecentChangesEntry[]> {
    const rcend = new Date(since).toISOString();
    const result: IRecentChangesQuery = await this.apiQuery(interwiki, {
      list: 'recentchanges',
      rcprop: 'title|sizes|user',
      rclimit: 'max',
      rcend
    });
    // Exclude admins
    const admins = await FandomUtilities.getAdmins(interwiki);
    return result.query.recentchanges.filter((i) => !admins.includes(i.user));
  }

  static async getUserInfo(interwiki: string, username: string): Promise<IMediaWikiUser> {
    const result: IUsersQuery = await this.apiQuery(interwiki, {
      list: 'users',
      usprop: 'blockinfo|registration|implicitgroups|groups',
      ususers: username
    });

    if (
      result.error ||
      !result.query.users[0] ||
      typeof result.query.users[0].implicitgroups === 'undefined' ||
      result.query.users[0].missing
    )
      throw new NonExistentUser(username);

    return result.query.users[0];
  }

  static async getUserAvatar(username: string): Promise<string> {
    const res = await axios.get(`https://confederacion-hispana.fandom.com/es/api/v1/User/Details?ids=${username}`);
    return `${res.data.items[0].avatar.split('/thumbnail')[0]}?format=png`;
  }
}

import { Listener } from 'discord-akairo';
import type { Message } from 'discord.js';

const InterwikiPrefixes = {
  dev: 'https://dev.fandom.com/wiki/$1',
  github: 'https://github.com/$1',
  gh: 'https://github.com/$1', // github alias
  google: 'https://google.com/?q=$1',
  mw: 'https://www.mediawiki.org/wiki/$1',
  ud: 'https://www.urbandictionary.com/define.php?term=$1',
  w: 'https://community.fandom.com/wiki/w:$1',
  c: 'https://community.fandom.com/wiki/$1',
  wikipedia: 'https://en.wikipedia.org/wiki/$1',
  wp: 'https://en.wikipedia.org/wiki/$1' // wikipedia alias
};

class WikiLinksParser extends Listener {
  constructor() {
    super('wikiLinksParser', {
      emitter: 'client',
      event: 'message'
    });
  }

  exec(msg: Message): void {
    if (!msg.content) return;
    const capturedLinks = msg.content.match(/\[\[(.*?)(\|(.*?))?\]\](?=(?:[^`]*`[^`]*`)*[^`]*$)/g);
    if (!capturedLinks || !capturedLinks.length) return;
    let parsedLinks: string[] = [];

    for (const link of capturedLinks) {
      // Proceso de parseo
      const groups = link.match(/\[\[(.*?)(\|(.*?))?\]\]/);
      if (!groups || groups.length < 2) return;
      const prefix = groups[1].match(/^(.*?):(.*)/) || [];
      // desperate times ask for desperate measures
      const [, prefixCandidate, prefixContent] = prefix as [never, keyof typeof InterwikiPrefixes, string];
      const interwikiUrl: string = InterwikiPrefixes[prefixCandidate]
        ? `<${InterwikiPrefixes[prefixCandidate].replace(/\$1/g, prefixContent.replace(/ /g, '_'))}>`
        : `<https://comunidad.fandom.com/wiki/${groups[1].replace(/ /g, '_')}>`;
      parsedLinks = parsedLinks.concat(interwikiUrl);
    }

    msg.reply(parsedLinks.join('\n')).catch(this.client.logException);
  }
}

export default WikiLinksParser;

const InterwikiPrefixes = {
  dev: 'https://dev.fandom.com/wiki/$1',
  github: 'https://github.com/$1',
  gh: 'https://github.com/$1', // github alias
  google: 'https://google.com/?q=$1',
  mw: 'http://www.mediawiki.org/wiki/$1',
  ud: 'https://www.urbandictionary.com/define.php?term=$1',
  w: 'https://community.fandom.com/wiki/w:$1',
  c: 'https://community.fandom.com/wiki/$1',
  wikipedia: 'https://wikipedia.org/$1',
  wp: 'https://wikipedia.org/$1' // wikipedia alias
};

const ParseWikiLinks = (msg, client) => {
  let parsedMsg = msg.content;
  const capturedLinks = msg.content.match(/\[\[(.*?)(\|(.*?))?\]\]/g);
  if (!capturedLinks.length) return;
  capturedLinks.forEach((link) => {
    // Proceso de parseo
    const groups = link.match(/\[\[(.*?)(\|(.*?))?\]\]/),
      [, prefixCandidate, prefixContent] = groups[1].match(/^(.*?):(.*)/);
    const interwikiUrl = InterwikiPrefixes[prefixCandidate]
      ? InterwikiPrefixes[prefixCandidate].replace(/\$1/g, prefixContent.replace(/ /g, '_'))
      : `https://comunidad.fandom/wiki/${groups[1].replace(/ /g, '_')}`;
    const displayText = groups[3] || prefixContent || groups[1];
    parsedMsg = parsedMsg.replace(link, `[${displayText}](${interwikiUrl})`);
  });
  msg.delete();
  msg.channel.createWebhook(msg.member.nickname ? msg.member.nickname : msg.author.username, {
    avatar: msg.author.avatarURL({ size: 512 }),
    reason: 'Parsear wiki link'
  }).then((wh) => {
    wh.send(parsedMsg).then(() => {
      wh.delete();
    });
  }).catch((err) => {
    client.logger.fatal(err);
    client.rollbar.error(err);
  });
};

export default ParseWikiLinks;

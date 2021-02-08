import { Listener } from 'discord-akairo';

// Tasks
import AttemptVerify from '../tasks/AttemptVerify';
import ParseWikiLinks from '../tasks/ParseWikiLinks';

class MessageListener extends Listener {
  constructor() {
    super('message', {
      emitter: 'client',
      event: 'message'
    });
  }

  async exec(msg) {
    if (msg.author.bot) return;
    if (!msg.content) return;

    if (msg.channel.id === process.env.VERIF_CHANNEL) AttemptVerify(msg, this.client);
    else ParseWikiLinks(msg, this.client);
  }
}

export default MessageListener;

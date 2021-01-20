import { Listener } from 'discord-akairo';
import { Message } from 'discord.js';

class MessageListener extends Listener {
  constructor() {
    super('message', {
      emitter: 'client',
      event: 'message'
    });
  }

  exec(message: Message): void {
    console.log('message', message);
  }
}

export default MessageListener;

import { Listener } from 'discord-akairo';

class ReadyListener extends Listener {
  constructor() {
    super('ready', {
      emitter: 'client',
      event: 'ready'
    });
  }

  exec(): void {
    this.client.logger.info('[Discord] Ready!');
    if (this.client.user) {
      this.client.user.setPresence({
        activity: {
          name: `${this.client.users.cache.size} usuarios | version ${this.client.version}`
        },
        status: 'online'
      }).catch(console.error);
    }
  }
}

export default ReadyListener;

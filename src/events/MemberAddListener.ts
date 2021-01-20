import { Listener } from 'discord-akairo';
import { GuildMember } from 'discord.js';

class MemberAddListener extends Listener {
  constructor() {
    super('guildMemberAdd', {
      emitter: 'client',
      event: 'guildMemberAdd'
    });
  }

  exec(member: GuildMember): void {
    console.log('member join', member);
  }
}

export default MemberAddListener;

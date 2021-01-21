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
    this.client.logger.info('Nuevo miembro', {
      userId: member.user.id,
      userTag: `${member.user.username}#${member.user.discriminator}`,
      source: 'user-log'
    });
  }
}

export default MemberAddListener;

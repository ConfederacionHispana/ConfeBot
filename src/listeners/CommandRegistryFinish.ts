import { Events, Listener, PreconditionContainerSingle } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { env } from '../lib';
import type { ListenerOptions } from '@sapphire/framework';
import { GuildApplicationCommandManager } from 'discord.js';
import type { ApplicationCommandPermissionData } from 'discord.js';

@ApplyOptions<ListenerOptions>({
  enabled: true,
  event: Events.CommandApplicationCommandRegistryFinish,
  once: true
})
export class UserEvent extends Listener {
  public async run(): Promise<void> {
    const guilds = await this.container.client.guilds.fetch();
    const applicationCommandManager = env.NODE_ENV === 'development'
      ? (await this.container.client.guilds.fetch(env.GUILD_ID)).commands
      : this.container.client.application?.commands;
    if (!applicationCommandManager) return;
    
    const loadedCommands = await applicationCommandManager.fetch({});

    const registries = this.container.applicationCommandRegistries;
    const guildIds = guilds.map(i => i.id);

    for (const [, chatInputCommand] of loadedCommands) {
      const registry = registries.acquire(chatInputCommand.name);
      if (registry.chatInputCommands.size === 0) continue;

      this.container.client.chatInputCommandsData.addIdHint(chatInputCommand.name, chatInputCommand.id);
      this.container.client.chatInputCommandsData.save();

      const messageCommand = registry.command;
      if (!messageCommand) continue;

      const preconditions = this.container.stores.get('preconditions');
      const roles = new Set<string>();
      for (const entry of messageCommand.preconditions.entries) {
        if (entry instanceof PreconditionContainerSingle) {
          const precondition = preconditions.get(entry.name);
          const role = precondition?.allowedRoles;
          role?.forEach(id => roles.add(id));
        }
      }
      
      if (roles.size === 0) continue;
      const permissions: ApplicationCommandPermissionData[] = [...roles].map(role => ({
        id: role,
        permission: true,
        type: 'ROLE'
      }));
      console.log(permissions);
      if (applicationCommandManager instanceof GuildApplicationCommandManager) {
        await applicationCommandManager.permissions.set({
          fullPermissions: [{
            id: chatInputCommand.id,
            permissions
          }]
        });
      } else {
        for (const guildId of guildIds) {
          await applicationCommandManager.permissions.set({
            command: chatInputCommand.id,
            guild: guildId,
            permissions
          });
        }
      }
    }
  }
}

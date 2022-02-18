import { Events, Listener } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { env } from '../lib';
import type { ListenerOptions } from '@sapphire/framework';

@ApplyOptions<ListenerOptions>({
    enabled: env.NODE_ENV === 'development',
	event: Events.CommandApplicationCommandRegistryFinish,
	once: true
})
export class UserEvent extends Listener {
	public async run(): Promise<void> {
		const loadedCommands = env.NODE_ENV === 'development'
			? await (await this.container.client.guilds.fetch(env.GUILD_ID)).commands.fetch()
			: await this.container.client.application?.commands.fetch();
		if (!loadedCommands) return;
		const registries = this.container.applicationCommandRegistries;
		for (const [ _, command ] of loadedCommands) {
			const registry = registries.acquire(command.name);
			if (registry.chatInputCommands.size === 0) continue;
			this.container.client.chatInputCommandsData.addIdHint(command.name, command.id);
		}
		this.container.client.chatInputCommandsData.save();
	}
}

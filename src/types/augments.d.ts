import type { TaskStore } from '#lib/structures/TaskStore';

declare module '@sapphire/pieces' {
	interface StoreRegistryEntries {
    tasks: TaskStore
	}
}

import { AliasStore } from '@sapphire/pieces';
import { Model } from './Model';

export class ModelStore extends AliasStore<Model> {
	public constructor() {
		// @ts-expect-error - Either expect-error or cast to any: https://github.com/sapphiredev/framework/blob/db6febd56afeaeff1f23afce2a269beecb316804/src/lib/structures/CommandStore.ts#L10
		super(Model, {
			name: 'models'
		});
        
	}

    public override get<K extends keyof ModelRegistryEntries>(key: K): ModelRegistryEntries[ K ] {
        return super.get(key) as unknown as ModelRegistryEntries[ K ];
        
    }
}

declare module '@sapphire/pieces' {
	interface StoreRegistryEntries {
		'models': ModelStore
	}
}

declare global {
    interface ModelRegistryEntries {
    }
}
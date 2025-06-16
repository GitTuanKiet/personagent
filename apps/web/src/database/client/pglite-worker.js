import { worker } from '@electric-sql/pglite/worker';

worker({
	init: async ({ wasmModule, fsBundle, meta }) => {
		const { vectorBundlePath, dbName } = meta;
		const { PGlite } = await import('@electric-sql/pglite');

		return new PGlite({
			dataDir: `idb://${dbName}`,
			fsBundle,
			extensions: {
				vector: {
					name: 'pgvector',
					setup: async (pglite, options) => {
						return { bundlePath: new URL(vectorBundlePath), options };
					},
				},
			},
			relaxedDurability: true,
			wasmModule,
		});
	},
});

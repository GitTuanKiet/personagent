import { PGliteWorker, PGliteWorkerOptions } from '@electric-sql/pglite/worker';
import type { PGlite } from '@electric-sql/pglite';

export const initPgliteWorker = async ({
	meta,
	fsBundle,
	wasmModule,
}: Pick<PGliteWorkerOptions, 'fsBundle' | 'wasmModule' | 'meta'>): Promise<PGlite> => {
	const pglite = new PGliteWorker(
		new Worker(new URL('./pglite-worker.js', import.meta.url), {
			type: 'module',
		}),
		{
			wasmModule,
			fsBundle,
			meta,
		},
	);

	pglite.onLeaderChange(() => {
		console.log('Worker leader changed, isLeader:', pglite.isLeader);
	});

	return pglite as unknown as PGlite;
};

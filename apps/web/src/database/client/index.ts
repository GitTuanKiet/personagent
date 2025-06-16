import { type PgliteDatabase, drizzle } from 'drizzle-orm/pglite';
import type {
	PGlite as PGliteType,
	IdbFs as IdbFsType,
	MemoryFS as MemoryFSType,
} from '@electric-sql/pglite';
import type { vector as vectorType } from '@electric-sql/pglite/vector';
import type { DatabaseLoadingCallbacks, MigrationTableItem } from './types';
import { wyhash } from '@/lib/wyhash';

import migrations from './migrations.json';
import { sql } from 'drizzle-orm';
import * as schema from './schema';

type DatabaseSchema = typeof schema;
type DrizzleInstance = PgliteDatabase<DatabaseSchema> & { $client: PGliteType };

export const dbName = 'pglite_db';
const pgliteSchemaHashCache = 'PGLITE_SCHEMA_HASH';

export class DatabaseConnection {
	private static instance: DatabaseConnection;

	private WASM_CDN_URL = 'https://cdn.jsdelivr.net/npm/@electric-sql/pglite/dist/pglite.wasm';
	private FSBUNDLER_CDN_URL = 'https://cdn.jsdelivr.net/npm/@electric-sql/pglite/dist/pglite.data';
	private VECTOR_CDN_URL = 'https://cdn.jsdelivr.net/npm/@electric-sql/pglite/dist/vector.tar.gz';

	private callbacks?: DatabaseLoadingCallbacks;
	private _db?: DrizzleInstance;

	private initPromise?: Promise<DrizzleInstance>;
	private isSynced = false;

	constructor() {
		if (DatabaseConnection.instance) {
			return DatabaseConnection.instance;
		}

		DatabaseConnection.instance = this;
	}

	get db() {
		if (!this._db) {
			throw new Error('Database not initialized. Please call `initialize()` first.');
		}

		return this._db;
	}

	private async loadWasmModule() {
		const start = Date.now();
		this.callbacks?.onStateChange?.('loadingWasm');

		const response = await fetch(this.WASM_CDN_URL);

		const contentLength = Number(response.headers.get('Content-Length')) || 0;
		const reader = response.body?.getReader();

		if (!reader) throw new Error('Failed to start WASM download');

		let receivedLength = 0;
		const chunks: Uint8Array[] = [];

		// eslint-disable-next-line no-constant-condition
		while (true) {
			const { done, value } = await reader.read();

			if (done) break;

			chunks.push(value);
			receivedLength += value.length;

			// 计算并报告进度
			const progress = Math.min(Math.round((receivedLength / contentLength) * 100), 100);
			this.callbacks?.onProgress?.({
				phase: 'wasm',
				progress,
			});
		}

		// 合并数据块
		const wasmBytes = new Uint8Array(receivedLength);
		let position = 0;
		for (const chunk of chunks) {
			wasmBytes.set(chunk, position);
			position += chunk.length;
		}

		this.callbacks?.onProgress?.({
			costTime: Date.now() - start,
			phase: 'wasm',
			progress: 100,
		});

		// WASM
		return WebAssembly.compile(wasmBytes);
	}

	private fetchFsBundle = async () => {
		const res = await fetch(this.FSBUNDLER_CDN_URL);

		return await res.blob();
	};

	private async loadDependencies() {
		const start = Date.now();
		this.callbacks?.onStateChange?.('loadingDependencies');

		const imports = [
			import('@electric-sql/pglite').then((m) => ({
				IdbFs: m.IdbFs,
				MemoryFS: m.MemoryFS,
				PGlite: m.PGlite,
			})),
			import('@electric-sql/pglite/vector'),
			this.fetchFsBundle(),
		];

		let loaded = 0;
		const results = (await Promise.all(
			imports.map(async (importPromise) => {
				const result = await importPromise;
				loaded += 1;

				this.callbacks?.onProgress?.({
					phase: 'dependencies',
					progress: Math.min(Math.round((loaded / imports.length) * 100), 100),
				});
				return result;
			}),
		)) as [
			{
				IdbFs: typeof IdbFsType;
				MemoryFS: typeof MemoryFSType;
				PGlite: typeof PGliteType;
			},
			{
				vector: typeof vectorType;
			},
			fsBundle: Blob,
		];

		this.callbacks?.onProgress?.({
			costTime: Date.now() - start,
			phase: 'dependencies',
			progress: 100,
		});

		// @ts-ignore
		const [{ PGlite, IdbFs, MemoryFS }, { vector }, fsBundle] = results;

		return { IdbFs, MemoryFS, PGlite, fsBundle, vector };
	}

	private async migrate(skipMultiRun = false): Promise<DrizzleInstance> {
		if (this.isSynced && skipMultiRun) return this.db;

		let hash: string | undefined;
		if (typeof localStorage !== 'undefined') {
			const cacheHash = localStorage.getItem(pgliteSchemaHashCache);
			hash = wyhash(JSON.stringify(migrations)).toString(16);
			// if hash is the same, no need to migrate
			if (hash === cacheHash) {
				try {
					const result = await this.db.execute(
						sql`
                            SELECT COUNT(*) as table_count
                            FROM information_schema.tables
                            WHERE table_schema = 'public'
                        `,
					);
					const tableCount = parseInt(
						(result.rows[0] as { table_count?: string }).table_count || '0',
					);
					if (tableCount > 0) {
						this.isSynced = true;
						return this.db;
					}
				} catch (error) {
					console.warn('Error checking table existence, proceeding with migration', error);
				}
			}
		}

		const start = Date.now();
		try {
			this.callbacks?.onStateChange?.('migrating');

			// refs: https://github.com/drizzle-team/drizzle-orm/discussions/2532
			// @ts-expect-error
			await this.db.dialect.migrate(migrations, this.db.session, {});

			if (typeof localStorage !== 'undefined' && hash) {
				localStorage.setItem(pgliteSchemaHashCache, hash);
			}

			this.isSynced = true;

			console.info(`🗂 Migration success, take ${Date.now() - start}ms`);
		} catch (cause) {
			console.error('❌ Local database schema migration failed', cause);
			throw cause;
		}

		return this.db;
	}

	async initialize(callbacks?: DatabaseLoadingCallbacks): Promise<DrizzleInstance> {
		if (this.initPromise) return this.initPromise;

		this.callbacks = callbacks;

		this.initPromise = (async () => {
			try {
				if (this._db) return this._db;

				const time = Date.now();
				this.callbacks?.onStateChange?.('initializing');

				const { fsBundle, PGlite, MemoryFS, IdbFs, vector } = await this.loadDependencies();

				const wasmModule = await this.loadWasmModule();

				const { initPgliteWorker } = await import('./pglite');

				let db: PGliteType;

				// make db as web worker if worker is available
				if (typeof Worker !== 'undefined' && typeof navigator.locks !== 'undefined') {
					db = await initPgliteWorker({
						meta: {
							dbName,
							vectorBundlePath: this.VECTOR_CDN_URL,
						},
						fsBundle,
						wasmModule,
					});
				} else {
					// in edge runtime or test runtime, we don't have worker
					db = new PGlite({
						extensions: { vector },
						fs: typeof window === 'undefined' ? new MemoryFS(dbName) : new IdbFs(dbName),
						relaxedDurability: true,
						wasmModule,
					});
				}

				this._db = drizzle({ client: db, schema });

				await this.migrate(true);

				this.callbacks?.onStateChange?.('finished');
				console.log(`✅ Database initialized in ${Date.now() - time}ms`);

				await new Promise((resolve) => setTimeout(resolve, 50));

				this.callbacks?.onStateChange?.('ready');

				return this.db;
			} catch (e) {
				this.initPromise = undefined;
				this.callbacks?.onStateChange?.('error');
				const error = e as Error;

				let migrationsTableData: MigrationTableItem[] = [];
				try {
					const result = await this.db.execute(
						sql`
                            SELECT * FROM "drizzle"."__drizzle_migrations" ORDER BY "created_at" DESC;
                        `,
					);
					migrationsTableData = result.rows as unknown as MigrationTableItem[];
				} catch (queryError) {
					console.error('Failed to query migrations table:', queryError);
				}

				this.callbacks?.onError?.({
					error: {
						message: error.message,
						name: error.name,
						stack: error.stack,
					},
					migrationTableItems: migrationsTableData,
					migrationsSQL: migrations,
				});

				console.error(error);
				throw error;
			}
		})();

		return this.initPromise;
	}

	get clientDB(): DrizzleInstance {
		return new Proxy({} as DrizzleInstance, {
			get: (target, prop) => {
				return this.db[prop as keyof DrizzleInstance];
			},
		});
	}

	async reset(): Promise<void> {
		if (this._db) {
			try {
				await this._db.$client.close();
				console.log('PGlite instance closed successfully.');
			} catch (e) {
				console.error('Error closing PGlite instance:', e);
			}
		}

		this._db = undefined;
		this.initPromise = undefined;
		this.isSynced = false;

		return new Promise<void>((resolve, reject) => {
			if (typeof indexedDB === 'undefined') {
				console.warn('IndexedDB is not available, cannot delete database');
				resolve();
				return;
			}

			const path = `/pglite/${dbName}`;
			const request = indexedDB.deleteDatabase(path);

			request.onsuccess = () => {
				console.log(`✅ Database '${dbName}' reset successfully`);

				if (typeof localStorage !== 'undefined') {
					localStorage.removeItem(pgliteSchemaHashCache);
				}

				resolve();
			};

			// eslint-disable-next-line unicorn/prefer-add-event-listener
			request.onerror = (event) => {
				const error = (event.target as IDBOpenDBRequest)?.error;
				console.error(`❌ Error resetting database '${dbName}':`, error);
				reject(
					new Error(
						`Failed to reset database '${dbName}'. Error: ${error?.message || 'Unknown error'}`,
					),
				);
			};

			request.onblocked = (event) => {
				console.warn(
					`Deletion of database '${dbName}' is blocked. This usually means other connections (e.g., in other tabs) are still open. Event:`,
					event,
				);
				reject(
					new Error(
						`Failed to reset database '${dbName}' because it is blocked by other open connections. Please close other tabs or applications using this database and try again.`,
					),
				);
			};
		});
	}
}

export const databaseConnection = new DatabaseConnection();

export const clientDB = databaseConnection.clientDB;

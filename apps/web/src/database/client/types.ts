export enum ClientDatabaseInitStage {
	Idle = 'idle',
	Initializing = 'initializing',
	LoadingDependencies = 'loadingDependencies',
	LoadingWasm = 'loadingWasm',
	Migrating = 'migrating',
	Finished = 'finished',
	Ready = 'ready',
	Error = 'error',
}

export interface ClientDBLoadingProgress {
	costTime?: number;
	phase: 'wasm' | 'dependencies';
	progress: number;
}

export interface MigrationSQL {
	bps: boolean;
	folderMillis: number;
	hash: string;
	sql: string[];
}

export interface MigrationTableItem {
	created_at: number;
	hash: string;
	id: number;
}

interface onErrorState {
	error: Error;
	migrationTableItems: MigrationTableItem[];
	migrationsSQL: MigrationSQL[];
}

export type OnStageChange = (state: ClientDatabaseInitStage) => void;

export interface DatabaseLoadingCallbacks {
	onError?: (error: onErrorState) => void;
	onProgress?: (progress: ClientDBLoadingProgress) => void;
	onStateChange?: OnStageChange;
}

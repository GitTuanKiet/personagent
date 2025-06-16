import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';
import type { StateCreator } from 'zustand/vanilla';
import type { SWRResponse } from 'swr';

import { useOnlyFetchOnceSWR } from '@/lib/swr';
import {
	ClientDatabaseInitStage,
	MigrationSQL,
	MigrationTableItem,
	OnStageChange,
} from '@/database/client/types';
import { createDevtools } from '../createDevtools';

type InitClientDBParams = { onStateChange: OnStageChange };

interface GlobalAction {
	initializeClientDB: (params?: InitClientDBParams) => Promise<void>;
	useInitClientDB: (params?: InitClientDBParams) => SWRResponse;
}

interface GlobalState {
	initClientDBError?: Error;
	initClientDBMigrations?: {
		sqls: MigrationSQL[];
		tableRecords: MigrationTableItem[];
	};
	initClientDBProcess?: { costTime?: number; phase: 'wasm' | 'dependencies'; progress: number };
	initClientDBStage: ClientDatabaseInitStage;
}

export interface GlobalStore extends GlobalState, GlobalAction {}

export const initialState: GlobalState = {
	initClientDBStage: ClientDatabaseInitStage.Idle,
} as const;

export const createStore: StateCreator<GlobalStore, [['zustand/devtools', never]]> = (
	set,
	get,
) => ({
	...initialState,
	initializeClientDB: async (params) => {
		// if the db has started initialized or not error, just skip.
		if (
			get().initClientDBStage !== ClientDatabaseInitStage.Idle &&
			get().initClientDBStage !== ClientDatabaseInitStage.Error
		)
			return;

		const { databaseConnection } = await import('@/database/client');
		await databaseConnection.initialize({
			onError: ({ error, migrationsSQL, migrationTableItems }) => {
				set({
					initClientDBError: error,
					initClientDBMigrations: {
						sqls: migrationsSQL,
						tableRecords: migrationTableItems,
					},
				});
			},
			onProgress: (data) => {
				set({ initClientDBProcess: data });
			},
			onStateChange: (state) => {
				if (Object.values(ClientDatabaseInitStage).includes(state)) {
					set({ initClientDBStage: state });
					params?.onStateChange?.(state);
				}
			},
		});
	},
	useInitClientDB: (params) =>
		useOnlyFetchOnceSWR('initClientDB', () => get().initializeClientDB(params)),
});

export const useGlobalStore = createWithEqualityFn<GlobalStore>()(
	subscribeWithSelector(createDevtools('global')(createStore)),
	shallow,
);

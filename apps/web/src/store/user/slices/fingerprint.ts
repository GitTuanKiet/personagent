import { StateCreator } from 'zustand';
import { load } from '@fingerprintjs/fingerprintjs';
import { useOnlyFetchOnceSWR } from '@/lib/swr';
import { storage } from '../utils';
import { STORAGE_KEYS } from '../constants';
import { AppLoadingStage } from '@/app/loading/stage';

export interface FingerprintState {
	visitorId: string | null;
	isLoading: boolean;
	error: string | null;
}

export interface FingerprintActions {
	initFingerprint: (params: { loadingStage: string }) => Promise<void>;
	useInitFingerprint: (params: { loadingStage: string }) => any;
	resetFingerprint: () => void;
}

export type FingerprintSlice = FingerprintState & FingerprintActions;

export const createFingerprintSlice: StateCreator<FingerprintSlice, [], [], FingerprintSlice> = (
	set,
	get,
) => ({
	// Initial state
	visitorId: null,
	isLoading: false,
	error: null,

	// Actions
	initFingerprint: async (params: { loadingStage: string }) => {
		if (get().visitorId || params.loadingStage !== AppLoadingStage.InitBrowser) {
			return;
		}

		set({ isLoading: true, error: null });

		try {
			// Try to get from localStorage first
			let visitorId = storage.get(STORAGE_KEYS.FINGERPRINT, null);

			if (visitorId) {
				set({ visitorId, isLoading: false });
				return;
			}

			// Generate new fingerprint
			const fp = await load();
			const result = await fp.get();

			set({ visitorId: result.visitorId });
			storage.set(STORAGE_KEYS.FINGERPRINT, result.visitorId);
		} catch (error) {
			console.error('Failed to initialize fingerprint:', error);
			set({
				visitorId: null,
				error: 'Failed to initialize browser fingerprint',
			});
		} finally {
			set({ isLoading: false });
		}
	},

	useInitFingerprint: (params: { loadingStage: string }) =>
		useOnlyFetchOnceSWR(['initFingerprint', params.loadingStage], () =>
			get().initFingerprint(params),
		),

	resetFingerprint: () => {
		set({
			visitorId: null,
			isLoading: false,
			error: null,
		});
		storage.remove(STORAGE_KEYS.FINGERPRINT);
	},
});

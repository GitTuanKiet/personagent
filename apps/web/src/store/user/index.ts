import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';
import type { StateCreator } from 'zustand/vanilla';
import { themeUtils } from './utils';
import { persistenceManager, persistenceUtils } from './persistence';
import { createDevtools } from '../createDevtools';

// Import all slices
import {
	createFingerprintSlice,
	type FingerprintSlice,
	createThemeSlice,
	type ThemeSlice,
	createUIPreferencesSlice,
	type UIPreferencesSlice,
	createUserPreferencesSlice,
	type UserPreferencesSlice,
	createDialogSlice,
	type DialogSlice,
	createPanelSlice,
	type PanelSlice,
	createSettingsSlice,
	type SettingsSlice,
	createNotificationSlice,
	type NotificationSlice,
	createAIProviderSlice,
	type AIProviderSlice,
} from './slices';

// Combined store interface
export interface UserStore
	extends FingerprintSlice,
		ThemeSlice,
		UIPreferencesSlice,
		UserPreferencesSlice,
		DialogSlice,
		PanelSlice,
		SettingsSlice,
		NotificationSlice,
		AIProviderSlice {}

const createStore: StateCreator<UserStore, [['zustand/devtools', never]]> = (...a) => ({
	...createFingerprintSlice(...a),
	...createThemeSlice(...a),
	...createUIPreferencesSlice(...a),
	...createUserPreferencesSlice(...a),
	...createDialogSlice(...a),
	...createPanelSlice(...a),
	...createSettingsSlice(...a),
	...createNotificationSlice(...a),
	...createAIProviderSlice(...a),
});

export const useUserStore = createWithEqualityFn<UserStore>()(
	subscribeWithSelector(createDevtools('user')(createStore)),
	shallow,
);

// Initialize settings and persistence on module load
if (typeof window !== 'undefined') {
	// Setup persistence auto-save callback
	persistenceManager.onAutoSave = () => {
		const state = useUserStore.getState();
		persistenceManager.saveCompleteState({
			visitorId: state.visitorId,
			theme: state.theme,
			ui: state.ui,
			preferences: state.preferences,
			dialogs: state.dialogs,
			panels: state.panels,
			notifications: state.notifications,
			credentials: state.credentials,
		});
	};

	// Enable persistence manager
	persistenceManager.enable();

	// Load settings on store initialization
	const loadedState = persistenceManager.loadCompleteState();
	if (loadedState) {
		// Apply loaded state to store
		useUserStore.setState({
			visitorId: loadedState.visitorId || null,
			theme: loadedState.theme || 'system',
			ui: loadedState.ui || useUserStore.getState().ui,
			preferences: loadedState.preferences || useUserStore.getState().preferences,
			dialogs: loadedState.dialogs || useUserStore.getState().dialogs,
			panels: loadedState.panels || useUserStore.getState().panels,
			notifications: loadedState.notifications || [],
			credentials: loadedState.credentials || useUserStore.getState().credentials,
		});

		// Apply theme and UI settings
		if (loadedState.theme) {
			themeUtils.applyTheme(loadedState.theme);
		}
		if (loadedState.ui) {
			useUserStore.getState().applyUISettings(loadedState.ui);
		}
	} else {
		// Fallback to legacy loading
		useUserStore.getState().loadSettings();
	}

	// Watch for system theme changes
	themeUtils.watchSystemTheme((systemTheme) => {
		const currentTheme = useUserStore.getState().theme;
		if (currentTheme === 'system') {
			themeUtils.applyTheme('system');
		}
	});

	// Subscribe to store changes for auto-persistence
	useUserStore.subscribe(
		(state) => state,
		(state) => {
			// Save state changes with debouncing
			persistenceUtils.saveUI(state.ui);
			persistenceUtils.savePreferences(state.preferences);
			persistenceUtils.saveTheme(state.theme);
			persistenceUtils.saveDialogs(state.dialogs);
			persistenceUtils.savePanels(state.panels);
			persistenceUtils.saveNotifications(state.notifications);
			// Note: credentials are saved by their own slice methods
		},
		{
			// Only trigger on specific changes to avoid excessive saves
			equalityFn: (a, b) =>
				a.ui === b.ui &&
				a.preferences === b.preferences &&
				a.theme === b.theme &&
				a.dialogs === b.dialogs &&
				a.panels === b.panels &&
				a.notifications === b.notifications &&
				a.credentials === b.credentials,
		},
	);
}

// Legacy compatibility
export const getVisitorId = () => {
	const visitorId = useUserStore.getState().visitorId;
	if (!visitorId) throw new Error('Unknown browser');
	return visitorId;
};

// Export types and utilities
export type {
	ThemeMode,
	UIPreferences,
	UserPreferences,
	DialogStates,
	PanelStates,
} from './types';
export type { AICredentials, AIProvider, AIModelConfig } from './slices/aiprovider';
export { themeUtils, cssUtils } from './utils';

// Export notification interface for external use
export type { Notification } from './slices';

// Export persistence utilities for external use
export { persistenceManager, persistenceUtils } from './persistence';

// Convenience functions for storage management
export const userStorageUtils = {
	// Export user data
	exportData: () => persistenceManager.exportUserData(),

	// Import user data
	importData: (jsonData: string) => persistenceManager.importUserData(jsonData),

	// Check storage health
	checkHealth: () => persistenceManager.checkStorageHealth(),

	// Cleanup old data
	cleanup: () => persistenceManager.cleanup(),

	// Reset all data
	reset: () => {
		persistenceManager.reset();
		// Reload the page to reset the store
		if (typeof window !== 'undefined') {
			window.location.reload();
		}
	},

	// Get storage size info
	getStorageInfo: () => {
		const { storage } = require('./utils');
		const totalSize = storage.getStorageSize();
		const maxSize = 5 * 1024 * 1024; // 5MB
		return {
			totalSize,
			maxSize,
			usage: (totalSize / maxSize) * 100,
		};
	},

	// Enable/disable auto-save
	enableAutoSave: () => persistenceManager.enable(),
	disableAutoSave: () => persistenceManager.disable(),
};

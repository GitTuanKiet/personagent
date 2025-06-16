import type {
	UIPreferences,
	UserPreferences,
	ThemeMode,
	DialogStates,
	PanelStates,
	APICredentials,
} from './types';
import { storage, settingsUtils } from './utils';
import { STORAGE_KEYS } from './constants';
import type { Notification } from './slices/notifications';

// Persistence configuration
export const PERSISTENCE_CONFIG = {
	AUTO_SAVE_INTERVAL: 30000, // 30 seconds
	DEBOUNCE_DELAY: 1000, // 1 second
	MAX_RETRIES: 3,
	SYNC_ON_FOCUS: true,
	SYNC_ON_VISIBILITY_CHANGE: true,
} as const;

// Complete user state interface
export interface CompleteUserState {
	visitorId: string | null;
	theme: ThemeMode;
	ui: UIPreferences;
	preferences: UserPreferences;
	dialogs: DialogStates;
	panels: PanelStates;
	notifications: Notification[];
	credentials: APICredentials;
	metadata: {
		lastSync: number;
		version: string;
	};
}

// Persistence manager class
export class PersistenceManager {
	private saveTimeouts = new Map<string, NodeJS.Timeout>();
	private autoSaveInterval?: NodeJS.Timeout;
	private retryCount = 0;
	private isEnabled = true;

	constructor() {
		this.setupEventListeners();
	}

	// Enable/disable persistence
	enable(): void {
		this.isEnabled = true;
		this.startAutoSave();
	}

	disable(): void {
		this.isEnabled = false;
		this.stopAutoSave();
		this.clearAllTimeouts();
	}

	// Debounced save for specific keys
	debouncedSave(key: string, data: any, immediate = false): void {
		if (!this.isEnabled) return;

		// Clear existing timeout
		const existingTimeout = this.saveTimeouts.get(key);
		if (existingTimeout) {
			clearTimeout(existingTimeout);
		}

		const delay = immediate ? 0 : PERSISTENCE_CONFIG.DEBOUNCE_DELAY;

		const timeout = setTimeout(() => {
			this.saveWithRetry(key, data);
			this.saveTimeouts.delete(key);
		}, delay);

		this.saveTimeouts.set(key, timeout);
	}

	// Save with retry logic
	private async saveWithRetry(key: string, data: any): Promise<boolean> {
		let success = false;
		let attempts = 0;

		while (!success && attempts < PERSISTENCE_CONFIG.MAX_RETRIES) {
			try {
				success = storage.set(key, data);
				if (success) {
					this.retryCount = 0; // Reset retry count on success
				}
			} catch (error) {
				console.error(`Failed to save ${key}, attempt ${attempts + 1}:`, error);
			}
			attempts++;
		}

		if (!success) {
			console.error(`Failed to save ${key} after ${PERSISTENCE_CONFIG.MAX_RETRIES} attempts`);
			this.retryCount++;

			// If too many failures, consider disabling auto-save temporarily
			if (this.retryCount > 10) {
				console.warn('Too many save failures, temporarily disabling auto-save');
				this.stopAutoSave();
				setTimeout(() => this.startAutoSave(), 60000); // Re-enable after 1 minute
			}
		}

		return success;
	}

	// Save complete state
	saveCompleteState(state: Partial<CompleteUserState>): Promise<boolean> {
		if (!this.isEnabled) return Promise.resolve(false);

		const completeState: Partial<CompleteUserState> = {
			...state,
			metadata: {
				lastSync: Date.now(),
				version: '1.0.0',
			},
		};

		return this.saveWithRetry(STORAGE_KEYS.COMPLETE_STATE, completeState);
	}

	// Load complete state
	loadCompleteState(): Partial<CompleteUserState> | null {
		try {
			const state = storage.get(STORAGE_KEYS.COMPLETE_STATE, null);

			if (!state) {
				// Fallback to loading individual pieces
				return this.loadLegacyState();
			}

			// Validate state structure
			if (this.validateStateStructure(state)) {
				return state;
			}

			console.warn('Invalid state structure, falling back to legacy loading');
			return this.loadLegacyState();
		} catch (error) {
			console.error('Failed to load complete state:', error);
			return this.loadLegacyState();
		}
	}

	// Load state from individual storage keys (legacy compatibility)
	private loadLegacyState(): Partial<CompleteUserState> {
		try {
			const loadedState = settingsUtils.loadCompleteState();

			return {
				visitorId: loadedState.fingerprint,
				theme: loadedState.theme,
				ui: loadedState.ui,
				preferences: loadedState.preferences,
				dialogs: loadedState.ui.dialogs,
				panels: loadedState.ui.panels,
				notifications: [],
				metadata: {
					lastSync: Date.now(),
					version: '1.0.0',
				},
			};
		} catch (error) {
			console.error('Failed to load legacy state:', error);
			return {};
		}
	}

	// Validate state structure
	private validateStateStructure(state: any): boolean {
		if (!state || typeof state !== 'object') return false;

		// Check required fields
		const requiredFields = ['metadata'];
		return requiredFields.every((field) => field in state);
	}

	// Auto-save functionality
	startAutoSave(): void {
		if (this.autoSaveInterval) return;

		this.autoSaveInterval = setInterval(() => {
			// This will be called by the store to save current state
			this.onAutoSave?.();
		}, PERSISTENCE_CONFIG.AUTO_SAVE_INTERVAL);
	}

	stopAutoSave(): void {
		if (this.autoSaveInterval) {
			clearInterval(this.autoSaveInterval);
			this.autoSaveInterval = undefined;
		}
	}

	// Auto-save callback (to be set by the store)
	onAutoSave?: () => void;

	// Clear all pending timeouts
	private clearAllTimeouts(): void {
		this.saveTimeouts.forEach((timeout) => clearTimeout(timeout));
		this.saveTimeouts.clear();
	}

	// Setup event listeners for sync triggers
	private setupEventListeners(): void {
		if (typeof window === 'undefined') return;

		// Save on page unload
		window.addEventListener('beforeunload', () => {
			this.onAutoSave?.();
		});

		// Sync when window gets focus
		if (PERSISTENCE_CONFIG.SYNC_ON_FOCUS) {
			window.addEventListener('focus', () => {
				this.onAutoSave?.();
			});
		}

		// Sync when page becomes visible
		if (PERSISTENCE_CONFIG.SYNC_ON_VISIBILITY_CHANGE) {
			document.addEventListener('visibilitychange', () => {
				if (!document.hidden) {
					this.onAutoSave?.();
				}
			});
		}
	}

	// Storage health monitoring
	checkStorageHealth(): {
		isHealthy: boolean;
		issues: string[];
		recommendations: string[];
	} {
		const health = settingsUtils.validateStorage();
		const recommendations: string[] = [];

		if (!health.isHealthy) {
			recommendations.push('Clear corrupted data and restart the application');
		}

		if (health.issues.includes('Storage approaching limit')) {
			recommendations.push('Clear old notifications and simulation data');
		}

		return {
			...health,
			recommendations,
		};
	}

	// Export/Import functionality
	exportUserData(): string {
		try {
			const completeState = this.loadCompleteState();
			return JSON.stringify(completeState, null, 2);
		} catch (error) {
			console.error('Failed to export user data:', error);
			throw new Error('Export failed');
		}
	}

	importUserData(jsonData: string): boolean {
		try {
			const importedState = JSON.parse(jsonData);

			if (!this.validateStateStructure(importedState)) {
				throw new Error('Invalid state structure');
			}

			return storage.set(STORAGE_KEYS.COMPLETE_STATE, importedState);
		} catch (error) {
			console.error('Failed to import user data:', error);
			return false;
		}
	}

	// Cleanup old data
	cleanup(): void {
		storage.cleanup();
	}

	// Reset all data
	reset(): void {
		storage.clear();
		this.clearAllTimeouts();
	}
}

// Create singleton instance
export const persistenceManager = new PersistenceManager();

// Helper functions for easy use
export const persistenceUtils = {
	// Save specific slices
	saveUI: (ui: UIPreferences) => persistenceManager.debouncedSave(STORAGE_KEYS.UI_PREFERENCES, ui),
	savePreferences: (preferences: UserPreferences) =>
		persistenceManager.debouncedSave(STORAGE_KEYS.USER_PREFERENCES, preferences),
	saveTheme: (theme: ThemeMode) => persistenceManager.debouncedSave(STORAGE_KEYS.THEME, theme),
	saveDialogs: (dialogs: DialogStates) =>
		persistenceManager.debouncedSave(STORAGE_KEYS.DIALOGS, dialogs),
	savePanels: (panels: PanelStates) =>
		persistenceManager.debouncedSave(STORAGE_KEYS.PANELS, panels),
	saveNotifications: (notifications: Notification[]) =>
		persistenceManager.debouncedSave(STORAGE_KEYS.NOTIFICATIONS, notifications),

	// Immediate save (no debounce)
	saveImmediateUI: (ui: UIPreferences) =>
		persistenceManager.debouncedSave(STORAGE_KEYS.UI_PREFERENCES, ui, true),
	saveImmediateTheme: (theme: ThemeMode) =>
		persistenceManager.debouncedSave(STORAGE_KEYS.THEME, theme, true),

	// Load specific slices
	loadUI: () => storage.get(STORAGE_KEYS.UI_PREFERENCES, null),
	loadPreferences: () => storage.get(STORAGE_KEYS.USER_PREFERENCES, null),
	loadTheme: () => storage.get(STORAGE_KEYS.THEME, null),
	loadDialogs: () => storage.get(STORAGE_KEYS.DIALOGS, null),
	loadPanels: () => storage.get(STORAGE_KEYS.PANELS, null),
	loadNotifications: () => storage.get(STORAGE_KEYS.NOTIFICATIONS, []),
};

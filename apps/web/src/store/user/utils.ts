import type { ThemeMode, UIPreferences, UserPreferences, DialogStates, PanelStates } from './types';
import { STORAGE_KEYS, DEFAULT_UI_PREFERENCES, DEFAULT_USER_PREFERENCES } from './constants';

// Enhanced storage configuration
const STORAGE_CONFIG = {
	VERSION: '1.0.0',
	PREFIX: 'pag_',
	COMPRESSION_ENABLED: true,
	ENCRYPTION_ENABLED: false, // Future feature
	MAX_STORAGE_SIZE: 5 * 1024 * 1024, // 5MB
} as const;

// Storage schema for validation
interface StorageSchema {
	version: string;
	timestamp: number;
	data: {
		fingerprint?: string | null;
		theme?: ThemeMode;
		ui?: UIPreferences;
		preferences?: UserPreferences;
		dialogs?: DialogStates;
		panels?: PanelStates;
		notifications?: Array<any>;
	};
}

// Simple compression utilities
const compressionUtils = {
	compress: (data: string): string => {
		if (!STORAGE_CONFIG.COMPRESSION_ENABLED) return data;

		// Simple compression using LZ-string-like algorithm
		try {
			// For now, just return as-is. Can implement actual compression later
			return data;
		} catch {
			return data;
		}
	},

	decompress: (data: string): string => {
		if (!STORAGE_CONFIG.COMPRESSION_ENABLED) return data;

		try {
			// For now, just return as-is. Can implement actual decompression later
			return data;
		} catch {
			return data;
		}
	},
};

// Enhanced storage utilities
export const storage = {
	// Basic operations
	get: <T>(key: string, defaultValue: T): T => {
		if (typeof window === 'undefined') return defaultValue;

		try {
			const item = localStorage.getItem(key);
			if (!item) return defaultValue;

			const decompressed = compressionUtils.decompress(item);
			const parsed = JSON.parse(decompressed);

			// Validate data if it's a schema object
			if (key.startsWith(STORAGE_CONFIG.PREFIX) && parsed.version) {
				return storage.validateAndMigrate(parsed, defaultValue);
			}

			return parsed;
		} catch (error) {
			console.warn(`Failed to parse localStorage item: ${key}`, error);
			storage.remove(key); // Remove corrupted data
			return defaultValue;
		}
	},

	set: <T>(key: string, value: T): boolean => {
		if (typeof window === 'undefined') return false;

		try {
			const serialized = JSON.stringify(value);
			const compressed = compressionUtils.compress(serialized);

			// Check storage size limit
			if (storage.getStorageSize() + compressed.length > STORAGE_CONFIG.MAX_STORAGE_SIZE) {
				console.warn('Storage size limit exceeded');
				storage.cleanup();
			}

			localStorage.setItem(key, compressed);
			return true;
		} catch (error) {
			console.error(`Failed to set localStorage item: ${key}`, error);
			return false;
		}
	},

	remove: (key: string): void => {
		if (typeof window === 'undefined') return;
		localStorage.removeItem(key);
	},

	clear: (): void => {
		if (typeof window === 'undefined') return;

		// Only clear PAG-related items
		Object.values(STORAGE_KEYS).forEach((key) => {
			localStorage.removeItem(key);
		});
	},

	// Advanced operations
	getStorageSize: (): number => {
		if (typeof window === 'undefined') return 0;

		let total = 0;
		for (let key in localStorage) {
			if (localStorage.hasOwnProperty(key) && key.startsWith(STORAGE_CONFIG.PREFIX)) {
				total += localStorage[key].length;
			}
		}
		return total;
	},

	cleanup: (): void => {
		if (typeof window === 'undefined') return;

		// Remove old or corrupted entries
		const keysToRemove: string[] = [];

		for (let key in localStorage) {
			if (localStorage.hasOwnProperty(key) && key.startsWith(STORAGE_CONFIG.PREFIX)) {
				try {
					const item = localStorage.getItem(key);
					if (item) {
						const data = JSON.parse(compressionUtils.decompress(item));

						// Remove entries older than 30 days
						if (data.timestamp && Date.now() - data.timestamp > 30 * 24 * 60 * 60 * 1000) {
							keysToRemove.push(key);
						}
					}
				} catch {
					keysToRemove.push(key); // Remove corrupted entries
				}
			}
		}

		keysToRemove.forEach((key) => localStorage.removeItem(key));
	},

	validateAndMigrate: <T>(data: any, defaultValue: T): T => {
		try {
			// Version check and migration
			if (!data.version || data.version !== STORAGE_CONFIG.VERSION) {
				console.log(
					'Migrating storage data from version',
					data.version,
					'to',
					STORAGE_CONFIG.VERSION,
				);
				// Perform migration if needed
				return storage.migrateData(data, defaultValue);
			}

			return data.data || defaultValue;
		} catch {
			return defaultValue;
		}
	},

	migrateData: <T>(oldData: any, defaultValue: T): T => {
		// Migration logic for different versions
		try {
			if (!oldData.version) {
				// Legacy data without version
				return oldData || defaultValue;
			}

			// Add migration cases for future versions
			switch (oldData.version) {
				case '0.9.0':
					// Migration from 0.9.0 to 1.0.0
					return oldData.data || defaultValue;
				default:
					return oldData.data || defaultValue;
			}
		} catch {
			return defaultValue;
		}
	},

	// Backup and restore
	exportData: (): string => {
		const data: Record<string, any> = {};

		Object.values(STORAGE_KEYS).forEach((key) => {
			const value = localStorage.getItem(key);
			if (value) {
				try {
					data[key] = JSON.parse(compressionUtils.decompress(value));
				} catch {
					data[key] = value; // Keep as string if can't parse
				}
			}
		});

		return JSON.stringify({
			version: STORAGE_CONFIG.VERSION,
			timestamp: Date.now(),
			data,
		});
	},

	importData: (jsonData: string): boolean => {
		try {
			const imported = JSON.parse(jsonData);

			if (!imported.data) {
				console.error('Invalid import data format');
				return false;
			}

			// Validate and import each key
			Object.entries(imported.data).forEach(([key, value]) => {
				if (Object.values(STORAGE_KEYS).includes(key as any)) {
					storage.set(key, value);
				}
			});

			return true;
		} catch (error) {
			console.error('Failed to import data:', error);
			return false;
		}
	},
};

// Theme utilities
export const themeUtils = {
	getSystemTheme: (): 'light' | 'dark' => {
		if (typeof window === 'undefined') return 'light';
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	},

	resolveTheme: (theme: ThemeMode): 'light' | 'dark' => {
		return theme === 'system' ? themeUtils.getSystemTheme() : theme;
	},

	applyTheme: (theme: ThemeMode): void => {
		if (typeof window === 'undefined') return;

		const resolvedTheme = themeUtils.resolveTheme(theme);
		const root = window.document.documentElement;

		// Remove existing theme classes
		root.classList.remove('light', 'dark');

		// Add new theme class
		root.classList.add(resolvedTheme);

		// Update meta theme-color for mobile browsers
		const metaThemeColor = document.querySelector('meta[name="theme-color"]');
		if (metaThemeColor) {
			metaThemeColor.setAttribute('content', resolvedTheme === 'dark' ? '#0f0f23' : '#ffffff');
		}

		// Store theme preference
		storage.set(STORAGE_KEYS.THEME, theme);
	},

	watchSystemTheme: (callback: (theme: 'light' | 'dark') => void): (() => void) => {
		if (typeof window === 'undefined') return () => {};

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handler = (e: MediaQueryListEvent) => {
			callback(e.matches ? 'dark' : 'light');
		};

		mediaQuery.addEventListener('change', handler);

		// Return cleanup function
		return () => mediaQuery.removeEventListener('change', handler);
	},
};

// Enhanced settings utilities with comprehensive state management
export const settingsUtils = {
	// UI Preferences
	loadUIPreferences: (): UIPreferences => {
		return storage.get(STORAGE_KEYS.UI_PREFERENCES, DEFAULT_UI_PREFERENCES);
	},

	saveUIPreferences: (preferences: UIPreferences): boolean => {
		const schema: StorageSchema = {
			version: STORAGE_CONFIG.VERSION,
			timestamp: Date.now(),
			data: { ui: preferences },
		};
		return storage.set(STORAGE_KEYS.UI_PREFERENCES, schema);
	},

	// User Preferences
	loadUserPreferences: (): UserPreferences => {
		return storage.get(STORAGE_KEYS.USER_PREFERENCES, DEFAULT_USER_PREFERENCES);
	},

	saveUserPreferences: (preferences: UserPreferences): boolean => {
		const schema: StorageSchema = {
			version: STORAGE_CONFIG.VERSION,
			timestamp: Date.now(),
			data: { preferences },
		};
		return storage.set(STORAGE_KEYS.USER_PREFERENCES, schema);
	},

	// Theme
	loadTheme: (): ThemeMode => {
		return storage.get(STORAGE_KEYS.THEME, 'system');
	},

	saveTheme: (theme: ThemeMode): boolean => {
		const schema: StorageSchema = {
			version: STORAGE_CONFIG.VERSION,
			timestamp: Date.now(),
			data: { theme },
		};
		return storage.set(STORAGE_KEYS.THEME, schema);
	},

	// Fingerprint
	loadFingerprint: (): string | null => {
		return storage.get(STORAGE_KEYS.FINGERPRINT, null);
	},

	saveFingerprint: (fingerprint: string): boolean => {
		const schema: StorageSchema = {
			version: STORAGE_CONFIG.VERSION,
			timestamp: Date.now(),
			data: { fingerprint },
		};
		return storage.set(STORAGE_KEYS.FINGERPRINT, schema);
	},

	// Complete state management
	saveCompleteState: (state: {
		ui?: UIPreferences;
		preferences?: UserPreferences;
		theme?: ThemeMode;
		fingerprint?: string | null;
		dialogs?: DialogStates;
		panels?: PanelStates;
		notifications?: Array<any>;
	}): boolean => {
		const schema: StorageSchema = {
			version: STORAGE_CONFIG.VERSION,
			timestamp: Date.now(),
			data: state,
		};

		// Save each part separately for better granular control
		let allSuccess = true;

		if (state.ui) {
			allSuccess = settingsUtils.saveUIPreferences(state.ui) && allSuccess;
		}
		if (state.preferences) {
			allSuccess = settingsUtils.saveUserPreferences(state.preferences) && allSuccess;
		}
		if (state.theme) {
			allSuccess = settingsUtils.saveTheme(state.theme) && allSuccess;
		}
		if (state.fingerprint) {
			allSuccess = settingsUtils.saveFingerprint(state.fingerprint) && allSuccess;
		}

		return allSuccess;
	},

	loadCompleteState: (): {
		ui: UIPreferences;
		preferences: UserPreferences;
		theme: ThemeMode;
		fingerprint: string | null;
	} => {
		return {
			ui: settingsUtils.loadUIPreferences(),
			preferences: settingsUtils.loadUserPreferences(),
			theme: settingsUtils.loadTheme(),
			fingerprint: settingsUtils.loadFingerprint(),
		};
	},

	// Auto-save functionality
	enableAutoSave: (interval: number = 30000): (() => void) => {
		let autoSaveInterval: NodeJS.Timeout;

		const saveCurrentState = () => {
			// This will be implemented by the store
			console.log('Auto-saving user state...');
		};

		if (typeof window !== 'undefined') {
			autoSaveInterval = setInterval(saveCurrentState, interval);

			// Save on page unload
			const handleBeforeUnload = () => {
				saveCurrentState();
			};

			window.addEventListener('beforeunload', handleBeforeUnload);

			// Return cleanup function
			return () => {
				clearInterval(autoSaveInterval);
				window.removeEventListener('beforeunload', handleBeforeUnload);
			};
		}

		return () => {}; // No-op for SSR
	},

	// Storage health check
	validateStorage: (): { isHealthy: boolean; issues: string[] } => {
		const issues: string[] = [];
		let isHealthy = true;

		try {
			// Check if localStorage is available
			if (typeof window === 'undefined' || !window.localStorage) {
				issues.push('localStorage not available');
				isHealthy = false;
				return { isHealthy, issues };
			}

			// Check storage quota
			const storageSize = storage.getStorageSize();
			if (storageSize > STORAGE_CONFIG.MAX_STORAGE_SIZE * 0.8) {
				issues.push('Storage approaching limit');
			}

			// Validate each stored item
			Object.values(STORAGE_KEYS).forEach((key) => {
				try {
					const item = localStorage.getItem(key);
					if (item) {
						JSON.parse(item);
					}
				} catch {
					issues.push(`Corrupted data in ${key}`);
					isHealthy = false;
				}
			});
		} catch (error) {
			issues.push(`Storage validation error: ${error}`);
			isHealthy = false;
		}

		return { isHealthy, issues };
	},
};

// CSS variables utilities
export const cssUtils = {
	setFontSize: (size: 'small' | 'medium' | 'large'): void => {
		if (typeof window === 'undefined') return;

		const root = window.document.documentElement;
		const sizeMap = {
			small: '14px',
			medium: '16px',
			large: '18px',
		};

		root.style.setProperty('--font-size-base', sizeMap[size]);
	},

	setDensity: (density: 'compact' | 'comfortable' | 'spacious'): void => {
		if (typeof window === 'undefined') return;

		const root = window.document.documentElement;
		const densityMap = {
			compact: '0.75',
			comfortable: '1',
			spacious: '1.25',
		};

		root.style.setProperty('--density-scale', densityMap[density]);
	},

	setAnimations: (enabled: boolean): void => {
		if (typeof window === 'undefined') return;

		const root = window.document.documentElement;
		root.style.setProperty('--transition-duration', enabled ? '0.2s' : '0s');
		root.classList.toggle('no-animations', !enabled);
	},
};

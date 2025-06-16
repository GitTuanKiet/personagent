import { StateCreator } from 'zustand';
import type { UIPreferences, UserPreferences, ThemeMode } from '../types';
import { storage, settingsUtils, themeUtils, cssUtils } from '../utils';
import { STORAGE_KEYS, DEFAULT_UI_PREFERENCES, DEFAULT_USER_PREFERENCES } from '../constants';

export interface SettingsState {
	isLoading: boolean;
	error: string | null;
}

export interface SettingsActions {
	loadSettings: () => void;
	saveSettings: (ui?: UIPreferences, preferences?: UserPreferences) => void;
	clearSettings: () => void;
	resetAll: () => void;
	importSettings: (data: { ui?: UIPreferences; preferences?: UserPreferences }) => void;
	exportSettings: () => { ui: UIPreferences; preferences: UserPreferences };
	initializeStore: () => void;
}

export type SettingsSlice = SettingsState & SettingsActions;

export const createSettingsSlice: StateCreator<SettingsSlice, [], [], SettingsSlice> = (
	set,
	get,
) => ({
	// Initial state
	isLoading: false,
	error: null,

	// Actions
	loadSettings: () => {
		try {
			set({ isLoading: true, error: null });

			const ui = settingsUtils.loadUIPreferences();
			const preferences = settingsUtils.loadUserPreferences();
			const visitorId = storage.get(STORAGE_KEYS.FINGERPRINT, null);

			// Apply UI settings
			themeUtils.applyTheme(ui.theme);
			cssUtils.setFontSize(ui.fontSize);
			cssUtils.setDensity(ui.density);
			cssUtils.setAnimations(ui.animationsEnabled);

			set({ isLoading: false });

			return { ui, preferences, visitorId };
		} catch (error) {
			console.error('Failed to load settings:', error);
			set({
				error: 'Failed to load user settings',
				isLoading: false,
			});
			return null;
		}
	},

	saveSettings: (ui?: UIPreferences, preferences?: UserPreferences) => {
		try {
			if (ui) {
				settingsUtils.saveUIPreferences(ui);
			}
			if (preferences) {
				settingsUtils.saveUserPreferences(preferences);
			}
		} catch (error) {
			console.error('Failed to save settings:', error);
			set({ error: 'Failed to save settings' });
		}
	},

	clearSettings: () => {
		// Clear storage (except fingerprint)
		storage.remove(STORAGE_KEYS.UI_PREFERENCES);
		storage.remove(STORAGE_KEYS.USER_PREFERENCES);
		storage.remove(STORAGE_KEYS.THEME);

		// Apply defaults
		themeUtils.applyTheme(DEFAULT_UI_PREFERENCES.theme);
		cssUtils.setFontSize(DEFAULT_UI_PREFERENCES.fontSize);
		cssUtils.setDensity(DEFAULT_UI_PREFERENCES.density);
		cssUtils.setAnimations(DEFAULT_UI_PREFERENCES.animationsEnabled);

		set({ error: null });
	},

	resetAll: () => {
		// Clear all storage
		storage.clear();

		// Apply defaults
		themeUtils.applyTheme(DEFAULT_UI_PREFERENCES.theme);
		cssUtils.setFontSize(DEFAULT_UI_PREFERENCES.fontSize);
		cssUtils.setDensity(DEFAULT_UI_PREFERENCES.density);
		cssUtils.setAnimations(DEFAULT_UI_PREFERENCES.animationsEnabled);

		set({
			isLoading: false,
			error: null,
		});
	},

	importSettings: (data: { ui?: UIPreferences; preferences?: UserPreferences }) => {
		try {
			if (data.ui) {
				settingsUtils.saveUIPreferences(data.ui);

				// Apply UI settings immediately
				themeUtils.applyTheme(data.ui.theme);
				cssUtils.setFontSize(data.ui.fontSize);
				cssUtils.setDensity(data.ui.density);
				cssUtils.setAnimations(data.ui.animationsEnabled);
			}

			if (data.preferences) {
				settingsUtils.saveUserPreferences(data.preferences);
			}

			set({ error: null });
		} catch (error) {
			console.error('Failed to import settings:', error);
			set({ error: 'Failed to import settings' });
		}
	},

	exportSettings: () => {
		const ui = settingsUtils.loadUIPreferences();
		const preferences = settingsUtils.loadUserPreferences();

		return { ui, preferences };
	},

	initializeStore: () => {
		// This method can be used to initialize settings for combined store
		const { loadSettings } = get();
		loadSettings();
	},
});

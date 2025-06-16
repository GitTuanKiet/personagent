import { StateCreator } from 'zustand';
import type { UIPreferences } from '../types';
import { cssUtils, settingsUtils, storage } from '../utils';
import { DEFAULT_UI_PREFERENCES, STORAGE_KEYS } from '../constants';

export interface UIPreferencesState {
	ui: UIPreferences;
}

export interface UIPreferencesActions {
	updateUIPreferences: (preferences: Partial<UIPreferences>) => void;
	resetUIPreferences: () => void;
	applyUISettings: (ui: UIPreferences) => void;
}

export type UIPreferencesSlice = UIPreferencesState & UIPreferencesActions;

export const createUIPreferencesSlice: StateCreator<
	UIPreferencesSlice,
	[],
	[],
	UIPreferencesSlice
> = (set, get) => ({
	// Initial state
	ui: DEFAULT_UI_PREFERENCES,

	// Actions
	updateUIPreferences: (preferences: Partial<UIPreferences>) => {
		const currentUI = get().ui;
		const newUI = { ...currentUI, ...preferences };

		set({ ui: newUI });

		// Apply visual changes immediately
		get().applyUISettings(newUI);

		// Persist to storage
		settingsUtils.saveUIPreferences(newUI);
	},

	resetUIPreferences: () => {
		set({ ui: DEFAULT_UI_PREFERENCES });

		// Apply defaults
		get().applyUISettings(DEFAULT_UI_PREFERENCES);

		// Clear storage
		storage.remove(STORAGE_KEYS.UI_PREFERENCES);
	},

	applyUISettings: (ui: UIPreferences) => {
		if (ui.fontSize !== undefined) {
			cssUtils.setFontSize(ui.fontSize);
		}
		if (ui.density !== undefined) {
			cssUtils.setDensity(ui.density);
		}
		if (ui.animationsEnabled !== undefined) {
			cssUtils.setAnimations(ui.animationsEnabled);
		}
	},
});

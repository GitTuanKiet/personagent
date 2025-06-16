import { StateCreator } from 'zustand';
import type { ThemeMode } from '../types';
import { themeUtils, cssUtils, settingsUtils } from '../utils';

export interface ThemeState {
	theme: ThemeMode;
}

export interface ThemeActions {
	setTheme: (theme: ThemeMode) => void;
	toggleTheme: () => void;
	applyTheme: (theme: ThemeMode) => void;
}

export type ThemeSlice = ThemeState & ThemeActions;

export const createThemeSlice: StateCreator<ThemeSlice, [], [], ThemeSlice> = (set, get) => ({
	// Initial state
	theme: 'system',

	// Actions
	setTheme: (theme: ThemeMode) => {
		set({ theme });
		get().applyTheme(theme);
	},

	toggleTheme: () => {
		const currentTheme = get().theme;
		const nextTheme: ThemeMode =
			currentTheme === 'light' ? 'dark' : currentTheme === 'dark' ? 'system' : 'light';

		get().setTheme(nextTheme);
	},

	applyTheme: (theme: ThemeMode) => {
		themeUtils.applyTheme(theme);
	},
});

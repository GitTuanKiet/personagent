import { StateCreator } from 'zustand';
import type { UserPreferences } from '../types';
import { settingsUtils, storage } from '../utils';
import { DEFAULT_USER_PREFERENCES, STORAGE_KEYS } from '../constants';

export interface UserPreferencesState {
	preferences: UserPreferences;
}

export interface UserPreferencesActions {
	updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
	resetUserPreferences: () => void;
}

export type UserPreferencesSlice = UserPreferencesState & UserPreferencesActions;

export const createUserPreferencesSlice: StateCreator<
	UserPreferencesSlice,
	[],
	[],
	UserPreferencesSlice
> = (set, get) => ({
	// Initial state
	preferences: DEFAULT_USER_PREFERENCES,

	// Actions
	updateUserPreferences: (preferences: Partial<UserPreferences>) => {
		const currentPrefs = get().preferences;
		const newPrefs = { ...currentPrefs, ...preferences };

		set({ preferences: newPrefs });
		settingsUtils.saveUserPreferences(newPrefs);
	},

	resetUserPreferences: () => {
		set({ preferences: DEFAULT_USER_PREFERENCES });
		storage.remove(STORAGE_KEYS.USER_PREFERENCES);
	},
});

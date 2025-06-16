import { StateCreator } from 'zustand';
import type { DialogStates } from '../types';
import { settingsUtils } from '../utils';
import { DEFAULT_DIALOG_STATES } from '../constants';

export interface DialogState {
	dialogs: DialogStates;
}

export interface DialogActions {
	openDialog: (dialogKey: keyof DialogStates) => void;
	closeDialog: (dialogKey: keyof DialogStates) => void;
	toggleDialog: (dialogKey: keyof DialogStates) => void;
	closeAllDialogs: () => void;
	isDialogOpen: (dialogKey: keyof DialogStates) => boolean;
}

export type DialogSlice = DialogState & DialogActions;

export const createDialogSlice: StateCreator<DialogSlice, [], [], DialogSlice> = (set, get) => ({
	// Initial state
	dialogs: DEFAULT_DIALOG_STATES,

	// Actions
	openDialog: (dialogKey: keyof DialogStates) => {
		const currentDialogs = get().dialogs;
		const newDialogs = { ...currentDialogs, [dialogKey]: true };

		set({ dialogs: newDialogs });
	},

	closeDialog: (dialogKey: keyof DialogStates) => {
		const currentDialogs = get().dialogs;
		const newDialogs = { ...currentDialogs, [dialogKey]: false };

		set({ dialogs: newDialogs });
	},

	toggleDialog: (dialogKey: keyof DialogStates) => {
		const currentDialogs = get().dialogs;
		const currentState = currentDialogs[dialogKey];
		const newDialogs = { ...currentDialogs, [dialogKey]: !currentState };

		set({ dialogs: newDialogs });
	},

	closeAllDialogs: () => {
		const newDialogs = { ...DEFAULT_DIALOG_STATES };
		set({ dialogs: newDialogs });
	},

	isDialogOpen: (dialogKey: keyof DialogStates) => {
		return get().dialogs[dialogKey];
	},
});

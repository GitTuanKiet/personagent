import { StateCreator } from 'zustand';
import type { PanelStates } from '../types';
import { DEFAULT_PANEL_STATES } from '../constants';

export interface PanelState {
	panels: PanelStates;
}

export interface PanelActions {
	setPanelMode: (mode: 'chat' | 'stream' | 'flow') => void;
	setPanelSize: (size: number) => void;
	resetPanelLayout: () => void;
}

export type PanelSlice = PanelState & PanelActions;

export const createPanelSlice: StateCreator<PanelSlice, [], [], PanelSlice> = (set, get) => ({
	// Initial state
	panels: DEFAULT_PANEL_STATES,

	// Actions
	setPanelMode: (mode: 'chat' | 'stream' | 'flow') => {
		const currentPanels = get().panels;
		const newPanels = { ...currentPanels, currentPanelMode: mode };
		set({ panels: newPanels });
	},

	setPanelSize: (size: number) => {
		const currentPanels = get().panels;
		const newSize = Math.round(Math.max(0, Math.min(size, 100)) * 100) / 100;
		const newPanels = {
			...currentPanels,
			resizablePanelSize: newSize,
		}; // Round to 2 decimal places
		console.log('setPanelSize:', { oldSize: currentPanels.resizablePanelSize, newSize, size });
		set({ panels: newPanels });
	},

	resetPanelLayout: () => {
		set({ panels: DEFAULT_PANEL_STATES });
	},
});

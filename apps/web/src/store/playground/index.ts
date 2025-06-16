import { create } from 'zustand';
import { createSimulationSlice, type SimulationSlice } from './slices/simulation';
import { createPersonaSlice, type PersonaSlice } from './slices/persona';
import { createApplicationSlice, type ApplicationSlice } from './slices/application';

interface PlaygroundState {
	// UI State
	taskInput: string;

	// Actions
	setTaskInput: (task: string) => void;
	canStartSimulation: () => boolean;
	handleNewSimulation: () => Promise<void>;
}

type PlaygroundStore = PlaygroundState & SimulationSlice & PersonaSlice & ApplicationSlice;

export const usePlaygroundStore = create<PlaygroundStore>((set, get, api) => ({
	taskInput: '',
	setTaskInput: (task) => set({ taskInput: task }),

	canStartSimulation: () => {
		const { getPinnedPersona, getPinnedApplication } = get();
		return !!(getPinnedPersona() && getPinnedApplication());
	},

	handleNewSimulation: async () => {
		const { setTaskInput, handlePinnedSimulation, getPinnedSimulation } = get();

		const pinnedSimulation = getPinnedSimulation();
		if (pinnedSimulation) {
			setTaskInput('');
			await handlePinnedSimulation();
		}
	},

	// Combine slices
	...createSimulationSlice(set, get, api),
	...createPersonaSlice(set, get, api),
	...createApplicationSlice(set, get, api),
}));

// Export types for convenience
export type { SimulationSlice, PersonaSlice, ApplicationSlice };

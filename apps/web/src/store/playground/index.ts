import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';
import type { StateCreator } from 'zustand/vanilla';
import { createSimulationSlice, type SimulationSlice } from './slices/simulation';
import { createPersonaSlice, type PersonaSlice } from './slices/persona';
import { createApplicationSlice, type ApplicationSlice } from './slices/application';
import { createDevtools } from '../createDevtools';
import { simulationService } from '@/services/simulation.service';

interface PlaygroundState {
	// UI State
	taskInput: string;
	runningSimulationId: number | null;
	runningSimulationAbortController: AbortController | null;

	// Actions
	setTaskInput: (task: string) => void;
	canStartSimulation: () => boolean;
	newSimulation: (navigateToNew?: () => void) => void;
	runSimulation: (navigateToSimulation?: (id: number) => void) => Promise<void>;
	stopSimulation: () => Promise<void>;
}

export type PlaygroundStore = PlaygroundState & SimulationSlice & PersonaSlice & ApplicationSlice;

const createStore: StateCreator<PlaygroundStore, [['zustand/devtools', never]]> = (
	set,
	get,
	api,
) => ({
	taskInput: '',
	runningSimulationId: null,
	runningSimulationAbortController: null,

	setTaskInput: (task) => set({ taskInput: task }),

	canStartSimulation: () => {
		const {
			getPinnedPersona,
			getPinnedApplication,
			runningSimulationId,
			runningSimulationAbortController,
		} = get();
		return (
			!!(getPinnedPersona() && getPinnedApplication()) &&
			!runningSimulationId &&
			!runningSimulationAbortController
		);
	},

	newSimulation: (navigateToNew?: () => void) => {
		if (navigateToNew) {
			navigateToNew();
		}
		set({
			taskInput: '',
			runningSimulationId: null,
			runningSimulationAbortController: null,
		});
	},

	runSimulation: async (navigateToSimulation?: (id: number) => void) => {
		const {
			taskInput,
			getPinnedPersona,
			getPinnedApplication,
			setTaskInput,
			updateSimulationInList,
			createSimulation,
		} = get();

		// Validation
		if (!taskInput.trim()) {
			return;
		}

		const pinnedPersona = getPinnedPersona();
		if (!pinnedPersona) {
			return;
		}

		const pinnedApplication = getPinnedApplication();
		if (!pinnedApplication) {
			return;
		}

		const abortController = new AbortController();
		let simulationId: number | null = null;

		try {
			setTaskInput('');

			const simulation = await createSimulation({
				personaId: pinnedPersona.id,
				applicationId: pinnedApplication.id,
				task: taskInput,
			});

			for await (const result of simulationService.runSimulation(
				simulation.id,
				abortController.signal,
			)) {
				// Set simulation ID and running state on first iteration
				if (!simulationId) {
					simulationId = simulation.id;

					// Navigate to new simulation page
					if (navigateToSimulation) {
						navigateToSimulation(simulation.id);
					}

					// Set running state
					set({
						runningSimulationId: simulation.id,
						runningSimulationAbortController: abortController,
					});
				}

				// Update UI with the latest state - service handles DB updates
				updateSimulationInList({ ...simulation, status: result.status });
				set({
					currentSimulation: { ...simulation, ...result },
				});
			}
		} finally {
			set({
				runningSimulationId: null,
				runningSimulationAbortController: null,
			});
		}
	},

	stopSimulation: async () => {
		const { runningSimulationId, runningSimulationAbortController } = get();

		if (!runningSimulationId || !runningSimulationAbortController) {
			return;
		}

		// Abort the current request
		runningSimulationAbortController.abort();

		// Reset state
		set({
			runningSimulationId: null,
			runningSimulationAbortController: null,
		});
	},

	// Combine slices
	...createSimulationSlice(set, get, api),
	...createPersonaSlice(set, get, api),
	...createApplicationSlice(set, get, api),
});

export const usePlaygroundStore = createWithEqualityFn<PlaygroundStore>()(
	subscribeWithSelector(createDevtools('global')(createStore)),
	shallow,
);

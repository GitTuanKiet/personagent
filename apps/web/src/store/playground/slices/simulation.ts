import { StateCreator } from 'zustand';
import { simulationService } from '@/services/simulation.service';
import type { SimulationInsert, SimulationSelect } from '@/database/client/schema';
import { PlaygroundStore } from '..';

export type SimulationListItem = Pick<
	SimulationSelect,
	'id' | 'task' | 'status' | 'createdAt' | 'updatedAt'
>;

interface SimulationState {
	simulations: SimulationListItem[];
	isSimulationLoading: boolean;
	hasMoreSimulation: boolean;
	currentSimulationPage: number;

	currentSimulation: SimulationSelect | null;
	isLoadingCurrentSimulation: boolean;
}

interface SimulationActions {
	loadSimulationList: (forceReset?: boolean) => Promise<void>;
	setCurrentSimulation: (id?: number | null) => Promise<void>;
	createSimulation: (data: SimulationInsert) => Promise<SimulationSelect>;
	updateSimulationInList: (simulation: SimulationSelect) => void;
	removeSimulation: (id: number) => Promise<void>;
	resetSimulations: () => void;
}

export interface SimulationSlice extends SimulationState, SimulationActions {}

export const createSimulationSlice: StateCreator<SimulationSlice, [], [], SimulationSlice> = (
	set,
	get,
) => ({
	// Initial state
	simulations: [],
	isSimulationLoading: false,
	hasMoreSimulation: false,
	currentSimulationPage: 0,

	currentSimulation: null,
	isLoadingCurrentSimulation: false,

	// Actions
	resetSimulations: () => {
		set({
			simulations: [],
			currentSimulationPage: 0,
			hasMoreSimulation: false,
			currentSimulation: null,
		});
	},

	setCurrentSimulation: async (id?: number | null) => {
		if (!id) {
			set({ currentSimulation: null });
			return;
		}

		set({ isLoadingCurrentSimulation: true });

		try {
			const simulation = await simulationService.getById(id);
			set({
				currentSimulation: simulation || null,
				isLoadingCurrentSimulation: false,
			});
		} catch (error) {
			console.error('Failed to load current simulation:', error);
			set({
				currentSimulation: null,
				isLoadingCurrentSimulation: false,
			});
		}
	},

	loadSimulationList: async (forceReset: boolean = false) => {
		const { currentSimulationPage } = get();

		// Reset on first page or when forced
		if (currentSimulationPage === 0 || forceReset) {
			set({
				simulations: [],
				currentSimulationPage: 0,
				hasMoreSimulation: false,
			});
		}

		set({ isSimulationLoading: true });

		try {
			const pinnedPersona = (get() as PlaygroundStore).getPinnedPersona();
			const pinnedApplication = (get() as PlaygroundStore).getPinnedApplication();

			const { data, hasMore } = await simulationService.queryBy(
				{
					personaId: pinnedPersona?.id,
					applicationId: pinnedApplication?.id,
					limit: 10,
					offset: (forceReset ? 0 : currentSimulationPage) * 10,
				},
				['id', 'task', 'status', 'createdAt', 'updatedAt'],
			);

			set(({ simulations }) => ({
				simulations: currentSimulationPage === 0 || forceReset ? data : [...simulations, ...data],
				hasMoreSimulation: hasMore,
				currentSimulationPage: (forceReset ? 0 : currentSimulationPage) + 1,
				isSimulationLoading: false,
			}));
		} catch (error) {
			console.error('Failed to load simulation list:', error);
			set({ isSimulationLoading: false });
		}
	},

	createSimulation: async (data: SimulationInsert) => {
		const simulation = await simulationService.add(data);

		const listItem = {
			id: simulation.id,
			task: simulation.task,
			status: simulation.status,
			createdAt: simulation.createdAt,
			updatedAt: simulation.updatedAt,
		};

		set(({ simulations }) => ({
			simulations: [listItem, ...simulations],
			currentSimulation: simulation,
		}));
		return simulation;
	},

	updateSimulationInList: (simulation: SimulationSelect) => {
		set(({ simulations }) => ({
			simulations: simulations.map((s) => (s.id === simulation.id ? simulation : s)),
		}));
	},

	removeSimulation: async (id: number) => {
		const currentSimulation = get().currentSimulation;
		await simulationService.remove(id);
		set(({ simulations }) => ({
			simulations: simulations.filter((s) => s.id !== id),
			currentSimulation: currentSimulation?.id === id ? null : currentSimulation,
		}));
	},
});

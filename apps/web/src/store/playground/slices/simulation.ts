import { StateCreator } from 'zustand';
import { toast } from 'sonner';
import { simulationService } from '@/services/simulation.service';
import type { SimulationSelect } from '@/database/client/schema';

export interface SimulationSlice {
	// State
	simulations: SimulationSelect[];
	isSimulationLoading: boolean;
	hasMoreSimulation: boolean;
	currentSimulationPage: number;

	// Actions
	loadSimulations: () => Promise<void>;
	removeSimulation: (id: number) => Promise<void>;
	handlePinnedSimulation: (simulationId?: number) => Promise<void>;
	getPinnedSimulation: () => SimulationSelect | null;
	handleRunSimulation: () => Promise<void>;
	handleStopSimulation: () => void;
}

export const createSimulationSlice: StateCreator<
	SimulationSlice & {
		getPinnedPersona: () => any;
		getPinnedApplication: () => any;
		taskInput: string;
		setTaskInput: (task: string) => void;
	},
	[],
	[],
	SimulationSlice
> = (set, get) => ({
	// State
	simulations: [],
	isSimulationLoading: false,
	hasMoreSimulation: false,
	currentSimulationPage: 0,

	loadSimulations: async () => {
		const currentSimulationPage = get().currentSimulationPage;
		if (currentSimulationPage === 0) {
			set({
				simulations: [],
				currentSimulationPage: 0,
				hasMoreSimulation: false,
			});
		}

		set({ isSimulationLoading: true });
		try {
			const pinnedPersona = get().getPinnedPersona();
			const pinnedApplication = get().getPinnedApplication();

			const { data, hasMore } = await simulationService.queryBy({
				personaId: pinnedPersona?.id,
				applicationId: pinnedApplication?.id,
				limit: 10,
				offset: currentSimulationPage * 10,
			});

			set(({ simulations }) => ({
				simulations: currentSimulationPage === 0 ? data : [...simulations, ...data],
				hasMoreSimulation: hasMore,
				currentSimulationPage: currentSimulationPage + 1,
				isSimulationLoading: false,
			}));
		} catch (error) {
			console.error('Failed to load simulations:', error);
			set({ isSimulationLoading: false });
		}
	},

	removeSimulation: async (id) => {
		await simulationService.remove(id);
		set((state) => ({
			simulations: state.simulations.filter((s) => s.id !== id),
		}));
	},

	handlePinnedSimulation: async (simulationId) => {
		if (!simulationId) {
			set((state) => ({
				simulations: state.simulations.map((s) => ({
					...s,
					pinned: false,
				})),
			}));
			return;
		}

		await simulationService.togglePin(simulationId);
		set((state) => ({
			simulations: state.simulations.map((s) => ({
				...s,
				pinned: s.id === simulationId ? !s.pinned : false,
			})),
		}));
	},

	getPinnedSimulation: () => {
		return get().simulations.find((s) => s.pinned) || null;
	},

	handleRunSimulation: async () => {
		const { taskInput, getPinnedPersona, getPinnedApplication, handlePinnedSimulation } = get();

		if (!taskInput.trim()) {
			toast.error('Please enter a task description');
			return;
		}

		const pinnedPersona = getPinnedPersona();

		if (!pinnedPersona) {
			toast.error('Missing pinned persona');
			return;
		}

		const pinnedApplication = getPinnedApplication();

		if (!pinnedApplication) {
			toast.error('Missing pinned application');
			return;
		}

		try {
			const simulation = await simulationService.add({
				personaId: pinnedPersona.id,
				applicationId: pinnedApplication.id,
				task: taskInput,
				status: 'running',
				state: null,
			});

			await handlePinnedSimulation(simulation.id);
			await simulationService.runStreaming(simulation.id);

			toast.success('Simulation started!');
		} catch (error) {
			toast.error('Failed to start simulation');
			console.error(error);
		}
	},

	handleStopSimulation: () => {
		// Currently we don't have a stop method in simulationService
		// The simulation will naturally end when the agent completes its task
		toast.info('Simulation stopped');
	},
});

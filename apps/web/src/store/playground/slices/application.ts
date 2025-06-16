import { StateCreator } from 'zustand';
import { applicationService } from '@/services/application.service';
import type { ApplicationSelect, ApplicationInsert } from '@/database/client/schema';

export interface ApplicationSlice {
	// State
	applications: ApplicationSelect[];
	isApplicationLoading: boolean;
	editingApplication: ApplicationSelect | null;

	// Actions
	getApplications: () => Promise<void>;
	getApplicationById: (id: number) => ApplicationSelect | undefined;
	applicationNameExists: (name: string) => Promise<boolean>;
	updateApplication: (id: number, data: Partial<ApplicationInsert>) => Promise<void>;
	createApplication: (data: ApplicationInsert) => Promise<void>;
	deleteApplication: (id: number) => Promise<void>;
	handlePinnedApplication: (applicationId: number) => Promise<void>;
	getPinnedApplication: () => ApplicationSelect | null;
	setEditingApplication: (application: ApplicationSelect | null) => void;
}

export const createApplicationSlice: StateCreator<
	ApplicationSlice & { loadSimulations: () => Promise<void> },
	[],
	[],
	ApplicationSlice
> = (set, get) => ({
	// State
	applications: [],
	isApplicationLoading: false,
	editingApplication: null,

	getApplications: async () => {
		set({ isApplicationLoading: true });
		const applications = await applicationService.getAll();
		set({ applications });
		set({ isApplicationLoading: false });
	},

	getApplicationById: (id) => {
		return get().applications.find((app) => app.id === id);
	},

	applicationNameExists: async (name) => {
		return await applicationService.existsName(name);
	},

	updateApplication: async (id, data) => {
		await applicationService.update(id, data);
		await get().getApplications();
	},

	createApplication: async (data) => {
		await applicationService.add(data);
		await get().getApplications();
	},

	deleteApplication: async (id) => {
		await applicationService.remove(id);
		await get().getApplications();
	},

	handlePinnedApplication: async (applicationId) => {
		const { loadSimulations } = get();

		set((state) => ({
			applications: state.applications.map((a) => ({
				...a,
				pinned: a.id === applicationId ? !a.pinned : false,
			})),
		}));

		await applicationService.togglePin(applicationId);
		await loadSimulations();
	},

	getPinnedApplication: () => {
		return get().applications.find((a) => a.pinned) || null;
	},

	setEditingApplication: (application) => {
		set({ editingApplication: application });
	},
});

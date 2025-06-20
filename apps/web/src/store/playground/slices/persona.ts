import { StateCreator } from 'zustand';
import { personaService } from '@/services/persona.service';
import type { PersonaSelect, PersonaInsert } from '@/database/client/schema';
import type { PlaygroundStore } from '..';

export interface PersonaSlice {
	// State
	personas: PersonaSelect[];
	isPersonaLoading: boolean;
	hasMorePersona: boolean;
	currentPersonaPage: number;
	editingPersona: PersonaSelect | null;

	// Actions
	loadPersonas: () => Promise<void>;
	resetPersonas: () => void;
	getPersonaById: (id: number) => PersonaSelect | undefined;
	personaNameExists: (name: string) => Promise<boolean>;
	updatePersona: (id: number, data: Partial<PersonaInsert>) => Promise<void>;
	createPersona: (data: PersonaInsert) => Promise<void>;
	deletePersona: (id: number) => Promise<void>;
	handlePinnedPersona: (personaId: number) => Promise<void>;
	getPinnedPersona: () => PersonaSelect | null;
	setEditingPersona: (persona: PersonaSelect | null) => void;
}

export const createPersonaSlice: StateCreator<PersonaSlice, [], [], PersonaSlice> = (set, get) => ({
	// State
	personas: [],
	isPersonaLoading: false,
	hasMorePersona: false,
	currentPersonaPage: 0,
	editingPersona: null,

	resetPersonas: () => {
		set({
			personas: [],
			currentPersonaPage: 0,
			hasMorePersona: false,
		});
	},

	loadPersonas: async () => {
		const currentPersonaPage = get().currentPersonaPage;
		if (currentPersonaPage === 0) {
			set({
				personas: [],
				currentPersonaPage: 0,
				hasMorePersona: false,
			});
		}

		set({ isPersonaLoading: true });
		try {
			const { data, hasMore } = await personaService.queryBy({
				limit: 10,
				offset: currentPersonaPage * 10,
			});

			set(({ personas }) => ({
				personas: currentPersonaPage === 0 ? data : [...personas, ...data],
				hasMorePersona: hasMore,
				currentPersonaPage: currentPersonaPage + 1,
				isPersonaLoading: false,
			}));
		} catch (error) {
			console.error('Failed to load personas:', error);
			set({ isPersonaLoading: false });
		}
	},

	getPersonaById: (id) => {
		return get().personas.find((persona) => persona.id === id);
	},

	personaNameExists: async (name) => {
		return await personaService.existsName(name);
	},

	updatePersona: async (id, data) => {
		await personaService.update(id, data);
		await get().loadPersonas();
	},

	createPersona: async (data) => {
		await personaService.add(data);
		get().resetPersonas();
		await get().loadPersonas();
	},

	deletePersona: async (id) => {
		set((state) => ({
			personas: state.personas.filter((p) => p.id !== id),
		}));
		await personaService.remove(id);
	},

	handlePinnedPersona: async (personaId) => {
		set((state) => ({
			personas: state.personas.map((p) => ({
				...p,
				pinned: p.id === personaId,
			})),
		}));

		await personaService.togglePin(personaId);

		const store = get() as PlaygroundStore;
		if (store.loadSimulationList) {
			await store.loadSimulationList(true);
		}
	},

	getPinnedPersona: () => {
		return get().personas.find((p) => p.pinned) || null;
	},

	setEditingPersona: (persona) => {
		set({ editingPersona: persona });
	},
});

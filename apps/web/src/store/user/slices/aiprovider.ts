import { StateCreator } from 'zustand';
import { storage } from '../utils';
import { STORAGE_KEYS } from '../constants';

export type AIProvider = 'openai' | 'anthropic' | 'gemini';

export interface AICredentials {
	openaiApiKey: string | null;
	anthropicApiKey: string | null;
	geminiApiKey: string | null;
}

export interface AIModelConfig {
	provider: AIProvider;
	model: string;
}

export interface AIProviderState {
	credentials: AICredentials;
	selectedModel: AIModelConfig | null;
	availableModels: Record<AIProvider, string[]>;
}

export interface AIProviderActions {
	setApiKey: (provider: AIProvider, apiKey: string) => void;
	getApiKey: (provider: AIProvider) => string | null;
	clearApiKey: (provider: AIProvider) => void;
	clearAllCredentials: () => void;
	setSelectedModel: (config: AIModelConfig) => void;
	getAvailableModels: (provider: AIProvider) => string[];
	getActiveProviders: () => AIProvider[];
}

export type AIProviderSlice = AIProviderState & AIProviderActions;

// Model definitions for each provider
const MODEL_DEFINITIONS: Record<AIProvider, string[]> = {
	openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
	anthropic: [
		'claude-3-5-sonnet-20241022',
		'claude-3-5-haiku-20241022',
		'claude-3-opus-20240229',
		'claude-3-sonnet-20240229',
		'claude-3-haiku-20240307',
	],
	gemini: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
};

export const createAIProviderSlice: StateCreator<AIProviderSlice, [], [], AIProviderSlice> = (
	set,
	get,
) => {
	const loadCredentials = (): AICredentials => {
		const stored = storage.get(STORAGE_KEYS.API_CREDENTIALS, {
			openaiApiKey: null,
			anthropicApiKey: null,
			geminiApiKey: null,
		});
		return stored;
	};

	const loadSelectedModel = (): AIModelConfig | null => {
		return storage.get(STORAGE_KEYS.SELECTED_AI_MODEL, null);
	};

	const saveCredentials = (credentials: AICredentials) => {
		storage.set(STORAGE_KEYS.API_CREDENTIALS, credentials);
	};

	const saveSelectedModel = (model: AIModelConfig | null) => {
		if (model) {
			storage.set(STORAGE_KEYS.SELECTED_AI_MODEL, model);
		} else {
			storage.remove(STORAGE_KEYS.SELECTED_AI_MODEL);
		}
	};

	const getActiveProviders = (): AIProvider[] => {
		const { credentials } = get();
		return (['openai', 'anthropic', 'gemini'] as AIProvider[]).filter(
			(provider) => !!credentials[`${provider}ApiKey` as keyof AICredentials],
		);
	};

	const updateAvailableModels = () => {
		const activeProviders = getActiveProviders();
		const availableModels: Record<AIProvider, string[]> = {
			openai: [],
			anthropic: [],
			gemini: [],
		};

		activeProviders.forEach((provider) => {
			availableModels[provider] = MODEL_DEFINITIONS[provider];
		});

		set({ availableModels });

		// Clear selected model if its provider is no longer active
		const { selectedModel } = get();
		if (selectedModel && !activeProviders.includes(selectedModel.provider)) {
			set({ selectedModel: null });
			saveSelectedModel(null);
		}
	};

	// Initialize with loaded data
	const initialCredentials = loadCredentials();
	const initialSelectedModel = loadSelectedModel();

	return {
		// Initial state
		credentials: initialCredentials,
		selectedModel: initialSelectedModel,
		availableModels: {
			openai: [],
			anthropic: [],
			gemini: [],
		},

		// API key operations
		setApiKey: (provider: AIProvider, apiKey: string) => {
			const { credentials } = get();
			const newCredentials = {
				...credentials,
				[`${provider}ApiKey`]: apiKey.trim() || null,
			};

			set({ credentials: newCredentials });
			saveCredentials(newCredentials);
			updateAvailableModels();
		},

		getApiKey: (provider: AIProvider) => {
			const { credentials } = get();
			return credentials[`${provider}ApiKey` as keyof AICredentials];
		},

		clearApiKey: (provider: AIProvider) => {
			const { credentials } = get();
			const newCredentials = {
				...credentials,
				[`${provider}ApiKey`]: null,
			};

			set({ credentials: newCredentials });
			saveCredentials(newCredentials);
			updateAvailableModels();
		},

		clearAllCredentials: () => {
			const emptyCredentials: AICredentials = {
				openaiApiKey: null,
				anthropicApiKey: null,
				geminiApiKey: null,
			};

			set({
				credentials: emptyCredentials,
				selectedModel: null,
				availableModels: {
					openai: [],
					anthropic: [],
					gemini: [],
				},
			});
			saveCredentials(emptyCredentials);
			saveSelectedModel(null);
		},

		// Model operations
		setSelectedModel: (config: AIModelConfig) => {
			set({ selectedModel: config });
			saveSelectedModel(config);
		},

		getAvailableModels: (provider: AIProvider) => {
			const { availableModels } = get();
			return availableModels[provider] || [];
		},

		getActiveProviders,
	};
};

import {
	ALL_MODEL_NAMES,
	ALL_MODELS,
	DEFAULT_MODEL_CONFIG,
	DEFAULT_MODEL_NAME,
} from '@/lib/models';
import type { CustomModelConfig } from '@/lib/models';
import { createClient } from '../hooks/utils';
import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { useUserContext } from './user-context';
import { useApplicationContext } from './application-context';
import { useAssistantContext } from './assistant-context';
import type { Thread } from '@/types';
import { toast } from 'sonner';
import { useQueryState } from 'nuqs';

type ThreadContentType = {
	threadId: string | null;
	userThreads: Thread[];
	isUserThreadsLoading: boolean;
	modelName: ALL_MODEL_NAMES;
	modelConfig: CustomModelConfig;
	modelConfigs: Record<ALL_MODEL_NAMES, CustomModelConfig>;
	createThreadLoading: boolean;
	getThread: (id: string) => Promise<Thread | undefined>;
	createThread: () => Promise<Thread | undefined>;
	getUserThreads: () => Promise<void>;
	deleteThread: (id: string, clearMessages: () => void) => Promise<void>;
	setThreadId: (id: string | null) => void;
	setModelName: (name: ALL_MODEL_NAMES) => void;
	setModelConfig: (modelName: ALL_MODEL_NAMES, config: CustomModelConfig) => void;
};

const ThreadContext = createContext<ThreadContentType | undefined>(undefined);

export function ThreadProvider({ children }: { children: ReactNode }) {
	const { user } = useUserContext();
	const { selectedApplication } = useApplicationContext();
	const { selectedAssistant } = useAssistantContext();
	const [threadId, setThreadId] = useQueryState('threadId');
	const [userThreads, setUserThreads] = useState<Thread[]>([]);
	const [isUserThreadsLoading, setIsUserThreadsLoading] = useState(false);
	const [modelName, setModelName] = useState<ALL_MODEL_NAMES>(DEFAULT_MODEL_NAME);
	const [createThreadLoading, setCreateThreadLoading] = useState(false);

	const [modelConfigs, setModelConfigs] = useState<Record<ALL_MODEL_NAMES, CustomModelConfig>>(
		() => {
			// Initialize with default configs for all models
			const initialConfigs: Record<ALL_MODEL_NAMES, CustomModelConfig> = {} as Record<
				ALL_MODEL_NAMES,
				CustomModelConfig
			>;

			ALL_MODELS.forEach((model) => {
				const modelKey = model.modelName || model.name;

				initialConfigs[modelKey] = {
					...model.config,
					provider: model.config.provider,
					temperatureRange: {
						...(model.config.temperatureRange || DEFAULT_MODEL_CONFIG.temperatureRange),
					},
					maxTokens: {
						...(model.config.maxTokens || DEFAULT_MODEL_CONFIG.maxTokens),
					},
					...(model.config.provider === 'azure_openai' && {
						azureConfig: {
							azureOpenAIApiKey: process.env._AZURE_OPENAI_API_KEY || '',
							azureOpenAIApiInstanceName: process.env._AZURE_OPENAI_API_INSTANCE_NAME || '',
							azureOpenAIApiDeploymentName: process.env._AZURE_OPENAI_API_DEPLOYMENT_NAME || '',
							azureOpenAIApiVersion: process.env._AZURE_OPENAI_API_VERSION || '2024-08-01-preview',
							azureOpenAIBasePath: process.env._AZURE_OPENAI_API_BASE_PATH,
						},
					}),
				};
			});
			return initialConfigs;
		},
	);

	const modelConfig = useMemo(() => {
		// Try exact match first, then try without "azure/" or "groq/" prefixes
		return modelConfigs[modelName] || modelConfigs[modelName.replace('azure/', '')];
	}, [modelName, modelConfigs]);

	const setModelConfig = (modelName: ALL_MODEL_NAMES, config: CustomModelConfig) => {
		setModelConfigs((prevConfigs) => {
			if (!config || !modelName) {
				return prevConfigs;
			}
			return {
				...prevConfigs,
				[modelName]: {
					...config,
					provider: config.provider,
					temperatureRange: {
						...(config.temperatureRange || DEFAULT_MODEL_CONFIG.temperatureRange),
					},
					maxTokens: {
						...(config.maxTokens || DEFAULT_MODEL_CONFIG.maxTokens),
					},
					...(config.provider === 'azure_openai' && {
						azureConfig: {
							...config.azureConfig,
							azureOpenAIApiKey:
								config.azureConfig?.azureOpenAIApiKey || process.env._AZURE_OPENAI_API_KEY || '',
							azureOpenAIApiInstanceName:
								config.azureConfig?.azureOpenAIApiInstanceName ||
								process.env._AZURE_OPENAI_API_INSTANCE_NAME ||
								'',
							azureOpenAIApiDeploymentName:
								config.azureConfig?.azureOpenAIApiDeploymentName ||
								process.env._AZURE_OPENAI_API_DEPLOYMENT_NAME ||
								'',
							azureOpenAIApiVersion:
								config.azureConfig?.azureOpenAIApiVersion || '2024-08-01-preview',
							azureOpenAIBasePath:
								config.azureConfig?.azureOpenAIBasePath || process.env._AZURE_OPENAI_API_BASE_PATH,
						},
					}),
				},
			};
		});
	};

	const createThread = async (): Promise<Thread | undefined> => {
		if (!selectedApplication || !selectedAssistant) {
			toast.error('Please select an application and assistant', {
				description: 'Please select an application and assistant to create a thread.',
				duration: 5000,
			});
			return;
		}

		const client = createClient();
		setCreateThreadLoading(true);

		try {
			const thread = await client.threads.create({
				metadata: {
					user_id: user.id,
					modelName: modelName,
					modelConfig: {
						...modelConfig,
						// Ensure Azure config is included if needed
						...(modelConfig.provider === 'azure_openai' && {
							azureConfig: modelConfig.azureConfig,
						}),
					},
					applicationId: String(selectedApplication.id),
					assistantId: selectedAssistant.assistant_id,
				},
			});

			setThreadId(thread.thread_id);
			// Fetch updated threads so the new thread is included.
			// Do not await since we do not want to block the UI.
			getUserThreads().catch(console.error);
			return thread as unknown as Thread;
		} catch (e) {
			console.error('Failed to create thread', e);
			toast.error('Failed to create thread', {
				description: 'An error occurred while trying to create a new thread. Please try again.',
				duration: 5000,
			});
		} finally {
			setCreateThreadLoading(false);
		}
	};

	const getUserThreads = async () => {
		setIsUserThreadsLoading(true);
		try {
			const client = createClient();

			const userThreads = await client.threads.search({
				metadata: {
					user_id: user.id,
					...(selectedApplication && { applicationId: String(selectedApplication.id) }),
					...(selectedAssistant && { assistantId: selectedAssistant.assistant_id }),
				},
				limit: 100,
			});

			if (userThreads.length > 0) {
				const lastInArray = userThreads[0];
				const allButLast = userThreads.slice(1, userThreads.length);
				const filteredThreads = allButLast.filter(
					(thread) => thread.values && Object.keys(thread.values).length > 0,
				);
				setUserThreads([...filteredThreads, lastInArray] as unknown as Thread[]);
			}
		} finally {
			setIsUserThreadsLoading(false);
		}
	};

	const deleteThread = async (id: string, clearMessages: () => void) => {
		setUserThreads((prevThreads) => {
			const newThreads = prevThreads.filter((thread) => thread.thread_id !== id);
			return newThreads;
		});
		if (id === threadId) {
			clearMessages();
			// Create a new thread. Use .then to avoid blocking the UI.
			// Once completed, `createThread` will re-fetch all user
			// threads to update UI.
			void createThread();
		}
		const client = createClient();
		try {
			await client.threads.delete(id);
		} catch (e) {
			console.error(`Failed to delete thread with ID ${id}`, e);
		}
	};

	const getThread = async (id: string): Promise<Thread | undefined> => {
		try {
			const client = createClient();
			return client.threads.get(id);
		} catch (e) {
			console.error('Failed to get thread by ID.', id, e);
			toast.error('Failed to get thread', {
				description: 'An error occurred while trying to get a thread.',
				duration: 5000,
			});
		}

		return undefined;
	};

	const contextValue: ThreadContentType = {
		threadId,
		userThreads,
		isUserThreadsLoading,
		modelName,
		modelConfig,
		modelConfigs,
		createThreadLoading,
		getThread,
		createThread,
		getUserThreads,
		deleteThread,
		setThreadId,
		setModelName,
		setModelConfig,
	};

	return <ThreadContext.Provider value={contextValue}>{children}</ThreadContext.Provider>;
}

export function useThreadContext() {
	const context = useContext(ThreadContext);
	if (context === undefined) {
		throw new Error('useThreadContext must be used within a ThreadProvider');
	}
	return context;
}

'use client';

import { useUserContext } from '@/contexts/user-context';
import type { GraphInput, Simulation, Thread, Persona } from '@/types';
import { AIMessage, BaseMessage, coerceMessageLikeToMessage } from '@langchain/core/messages';
import { useRuns } from '@/hooks/use-runs';
import {
	ALL_MODEL_NAMES,
	NON_STREAMING_TEXT_MODELS,
	NON_STREAMING_TOOL_CALLING_MODELS,
	DEFAULT_MODEL_CONFIG,
	DEFAULT_MODEL_NAME,
	CustomModelConfig,
} from '@/lib/models';
import {
	createContext,
	Dispatch,
	ReactNode,
	SetStateAction,
	useContext,
	useEffect,
	useRef,
	useState,
} from 'react';
import { replaceOrInsertMessageChunk } from './utils';
import { useThreadContext } from './thread-context';
import { useAssistantContext } from './assistant-context';
import { useApplicationContext } from './application-context';
import { StreamWorkerService } from '../workers/graph-stream';
import { toast } from 'sonner';

interface GraphData {
	runId: string | undefined;
	isStreaming: boolean;
	error: boolean;
	messages: BaseMessage[];
	setMessages: Dispatch<SetStateAction<BaseMessage[]>>;
	state: Simulation;
	firstTokenReceived: boolean;
	feedbackSubmitted: boolean;
	chatStarted: boolean;
	setChatStarted: Dispatch<SetStateAction<boolean>>;
	setIsStreaming: Dispatch<SetStateAction<boolean>>;
	setFeedbackSubmitted: Dispatch<SetStateAction<boolean>>;
	setState: Dispatch<SetStateAction<Simulation>>;
	streamMessage: (params: GraphInput) => Promise<void>;
	clearState: () => void;
	switchSelectedThread: (thread: Thread) => void;
}

type GraphContentType = {
	graphData: GraphData;
};

const GraphContext = createContext<GraphContentType | undefined>(undefined);

export function GraphProvider({ children }: { children: ReactNode }) {
	const userData = useUserContext();
	const assistantsData = useAssistantContext();
	const appData = useApplicationContext();
	const threadData = useThreadContext();
	const { shareRun } = useRuns();
	const [chatStarted, setChatStarted] = useState(false);
	const [messages, setMessages] = useState<BaseMessage[]>([]);
	const [state, setState] = useState<Simulation>({
		messages: [],
		actions: [],
		scripts: {},
		nSteps: 0,
		isDone: false,
	});
	const [isStreaming, setIsStreaming] = useState(false);
	const [threadSwitched, setThreadSwitched] = useState(false);
	const [firstTokenReceived, setFirstTokenReceived] = useState(false);
	const [runId, setRunId] = useState<string>();
	const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
	const [error, setError] = useState(false);

	useEffect(() => {
		if (typeof window === 'undefined' || !userData.user) return;

		// Get or create a new assistant if there isn't one set in state, and we're not
		// loading all assistants already.
		if (!assistantsData.selectedAssistant && !assistantsData.isLoadingAllAssistants) {
			assistantsData.getOrCreateAssistant();
		}

		// Get or create a new application if there isn't one set in state, and we're not
		// loading all applications already.
		if (!appData.selectedApplication && !appData.isLoadingAllApplications) {
			appData.getOrCreateApplication();
		}
	}, [userData.user]);

	// Very hacky way of ensuring updateState is not called when a thread is switched
	useEffect(() => {
		if (threadSwitched) {
			const timer = setTimeout(() => {
				setThreadSwitched(false);
			}, 1000);

			return () => clearTimeout(timer);
		}
	}, [threadSwitched]);

	const searchOrCreateEffectRan = useRef(false);

	// Attempt to load the thread if an ID is present in query params.
	useEffect(() => {
		if (
			typeof window === 'undefined' ||
			!userData.user ||
			threadData.createThreadLoading ||
			!threadData.threadId
		) {
			return;
		}

		// Only run effect once in development
		if (searchOrCreateEffectRan.current) {
			return;
		}
		searchOrCreateEffectRan.current = true;

		threadData.getThread(threadData.threadId).then((thread) => {
			if (thread) {
				switchSelectedThread(thread);
				return;
			}

			// Failed to fetch thread. Remove from query params
			threadData.setThreadId(null);
		});
	}, [threadData.threadId, userData.user]);

	const clearState = () => {
		setState({
			messages: [],
			actions: [],
			scripts: {},
			nSteps: 0,
			isDone: false,
		});
		setFirstTokenReceived(true);
	};

	const streamMessage = async (params: GraphInput) => {
		setFirstTokenReceived(false);
		setError(false);
		if (!assistantsData.selectedAssistant) {
			toast.error('Error', {
				description: 'No assistant ID found',
				duration: 5000,
			});
			return;
		}

		if (!appData.selectedApplication) {
			toast.error('Error', {
				description: 'No application ID found',
				duration: 5000,
			});
			return;
		}

		let currentThreadId = threadData.threadId;
		if (!currentThreadId) {
			const newThread = await threadData.createThread();
			if (!newThread) {
				toast.error('Error', {
					description: 'Failed to create thread',
					duration: 5000,
				});
				return;
			}
			currentThreadId = newThread.thread_id;
		}

		setIsStreaming(true);
		setRunId(undefined);
		setFeedbackSubmitted(false);
		let followupMessageId = '';

		try {
			const workerService = new StreamWorkerService();
			const stream = workerService.streamData({
				threadId: currentThreadId,
				assistantId: assistantsData.selectedAssistant.assistant_id,
				input: params,
				modelName: threadData.modelName,
				modelConfigs: threadData.modelConfigs,
				application: appData.selectedApplication,
				persona: assistantsData.selectedAssistant.config.configurable.persona as Persona,
			});

			for await (const chunk of stream) {
				try {
					const { event, data } = chunk;

					if (event === 'updates') {
						console.log('updates', data);
						setState((prevState) => ({
							...prevState,
							...Object.values(data)[0],
						}));
					}

					if (event === 'messages') {
						const [message, metadata] = data;
						console.log('messages', message, metadata);
						if (metadata.tags.includes('callModel')) {
							if (!followupMessageId) {
								followupMessageId = message.id;
							}
							setState((prevState) => ({
								...prevState,
								messages: replaceOrInsertMessageChunk(
									prevState.messages,
									coerceMessageLikeToMessage(message)[0],
								),
							}));
							setMessages((prevMessages) => [
								...prevMessages,
								coerceMessageLikeToMessage(message)[0],
							]);
						}
					}
				} catch (e: any) {
					console.error('Failed to parse stream chunk', chunk, '\n\nError:\n', e);

					let errorMessage = 'Unknown error. Please try again.';
					if (typeof e === 'object' && e?.message) {
						errorMessage = e.message;
					}

					toast.error('Error generating content', {
						description: errorMessage,
						duration: 5000,
					});
					setError(true);
					setIsStreaming(false);
					break;
				}
			}
		} catch (e) {
			console.error('Failed to stream message', e);
		} finally {
			setIsStreaming(false);
		}

		if (runId) {
			// Chain `.then` to not block the stream
			shareRun(runId).then(async (sharedRunURL) => {
				setState((prevState) => {
					const prevMessages = prevState.messages;
					const newMsgs = prevMessages.map((msg) => {
						if (
							msg.id === followupMessageId &&
							!(msg as AIMessage).tool_calls?.find((tc) => tc.name === 'langsmith_tool_ui')
						) {
							const toolCall = {
								name: 'langsmith_tool_ui',
								args: { sharedRunURL },
								id: sharedRunURL?.split('https://smith.langchain.com/public/')[1].split('/')[0],
							};
							const castMsg = msg as AIMessage;
							const newMessageWithToolCall = new AIMessage({
								...castMsg,
								content: castMsg.content,
								id: castMsg.id,
								tool_calls: castMsg.tool_calls ? [...castMsg.tool_calls, toolCall] : [toolCall],
							});
							return newMessageWithToolCall;
						}

						return msg;
					});
					return {
						...prevState,
						messages: newMsgs,
					};
				});
			});
		}
	};

	const switchSelectedThread = (thread: Thread) => {
		setThreadSwitched(true);
		setChatStarted(true);

		// Set the thread ID in state. Then set in cookies so a new thread
		// isn't created on page load if one already exists.
		threadData.setThreadId(thread.thread_id);

		// Set the model name and config
		if (thread.metadata?.modelName) {
			threadData.setModelName(thread.metadata.modelName as ALL_MODEL_NAMES);
			threadData.setModelConfig(
				thread.metadata.modelName as ALL_MODEL_NAMES,
				thread.metadata.modelConfig as CustomModelConfig,
			);
		} else {
			threadData.setModelName(DEFAULT_MODEL_NAME);
			threadData.setModelConfig(DEFAULT_MODEL_NAME, DEFAULT_MODEL_CONFIG);
		}

		setState(thread.values);
	};

	const contextValue: GraphContentType = {
		graphData: {
			runId,
			isStreaming,
			error,
			state,
			messages,
			setMessages,
			setState,
			firstTokenReceived,
			feedbackSubmitted,
			chatStarted,
			setChatStarted,
			setIsStreaming,
			setFeedbackSubmitted,
			streamMessage,
			clearState,
			switchSelectedThread,
		},
	};

	return <GraphContext.Provider value={contextValue}>{children}</GraphContext.Provider>;
}

export function useGraphContext() {
	const context = useContext(GraphContext);
	if (context === undefined) {
		throw new Error('useGraphContext must be used within a GraphProvider');
	}
	return context;
}

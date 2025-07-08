'use client';

import type { GraphInput, Thread, Persona, ThreadState } from '@/types';
import { BaseMessage, coerceMessageLikeToMessage } from '@langchain/core/messages';
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
import { StreamWorkerService } from '../workers/graph-stream';
import { toast } from 'sonner';
import { useApplicationContext } from './application-context';

interface GraphData {
	isStreaming: boolean;
	error: boolean;
	messages: BaseMessage[];
	setMessages: Dispatch<SetStateAction<BaseMessage[]>>;
	state: ThreadState;
	setState: Dispatch<SetStateAction<ThreadState>>;
	firstTokenReceived: boolean;
	chatStarted: boolean;
	setChatStarted: Dispatch<SetStateAction<boolean>>;
	setIsStreaming: Dispatch<SetStateAction<boolean>>;
	streamMessage: (params: GraphInput) => Promise<void>;
	clearState: () => void;
	switchSelectedThread: (thread: Thread) => void;
}

type GraphContentType = {
	graphData: GraphData;
};

const GraphContext = createContext<GraphContentType | undefined>(undefined);

export function GraphProvider({ children }: { children: ReactNode }) {
	const assistantsData = useAssistantContext();
	const threadData = useThreadContext();
	const { selectedApplication } = useApplicationContext();
	const [chatStarted, setChatStarted] = useState(false);
	const [messages, setMessages] = useState<BaseMessage[]>([]);
	const [state, setState] = useState<ThreadState>({
		scripts: {},
		isDone: false,
		usabilityIssues: [],
		messages: [],
		actions: [],
		nSteps: 0,
	});
	const [isStreaming, setIsStreaming] = useState(false);
	const [threadSwitched, setThreadSwitched] = useState(false);
	const [firstTokenReceived, setFirstTokenReceived] = useState(false);
	const [error, setError] = useState(false);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		// Get or create a new assistant if there isn't one set in state, and we're not
		// loading all assistants already.
		if (!assistantsData.selectedAssistant && !assistantsData.isLoadingAllAssistants) {
			assistantsData.getOrCreateAssistant();
		}
	}, []);

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
		if (typeof window === 'undefined' || threadData.createThreadLoading || !threadData.threadId) {
			return;
		}

		// Only run effect once in development
		if (searchOrCreateEffectRan.current) {
			return;
		}
		searchOrCreateEffectRan.current = true;

		threadData.getThread(threadData.threadId).then((thread) => {
			console.log('🚀 ~ threadData.getThread ~ thread:', thread);
			if (thread) {
				switchSelectedThread(thread);
				return;
			}

			// Failed to fetch thread. Remove from query params
			threadData.setThreadId(null);
		});
	}, [threadData.threadId]);

	const clearState = () => {
		setMessages([]);
		setState({
			scripts: {},
			isDone: false,
			usabilityIssues: [],
			messages: [],
			actions: [],
			nSteps: 0,
		});
		setFirstTokenReceived(true);
	};

	const streamMessage = async (params: GraphInput) => {
		console.log('🚀 ~ streamMessage ~ params:', params);
		setFirstTokenReceived(false);
		setError(false);
		if (!assistantsData.selectedAssistant) {
			toast.error('Error', {
				description: 'No assistant ID found',
				duration: 5000,
			});
			return;
		}

		if (!selectedApplication) {
			toast.error('Error', {
				description: 'No application selected',
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
		let followupMessageId = '';

		try {
			const workerService = new StreamWorkerService();
			const stream = workerService.streamData({
				threadId: currentThreadId,
				assistantId: assistantsData.selectedAssistant.assistant_id,
				input: params,
				application: selectedApplication,
				persona: assistantsData.selectedAssistant.config.configurable.persona as Persona,
				sessionId: assistantsData.userId,
			});

			for await (const chunk of stream) {
				try {
					const { event, data } = chunk;

					if (event === 'updates') {
						const value = Object.values(data)[0];
						console.log('🔄 STREAM UPDATE:', value);

						setState((prevState) => {
							const update = value.scripts;
							if (!update) {
								return {
									...prevState,
									...value,
								};
							}
							const scripts = { ...prevState.scripts };
							for (const step of Object.keys(update).map(Number)) {
								if (scripts[step]) {
									const ids = new Set(scripts[step].map((action) => action.id));
									scripts[step] = [
										...scripts[step],
										...(update[step] ?? []).filter((action) => !ids.has(action.id)),
									];
								} else {
									scripts[step] = update[step] ?? [];
								}
							}
							const newState = {
								...prevState,
								...value,
								scripts,
							};

							return newState;
						});
					}

					if (event === 'messages') {
						const [message, metadata] = data;
						console.log('🚀 ~ forawait ~ metadata:', metadata);
						if (metadata.name === 'callModel') {
							console.log('callModel', message);
							if (!followupMessageId) {
								followupMessageId = message.id;
							}
							setMessages((prevMessages) =>
								replaceOrInsertMessageChunk(prevMessages, coerceMessageLikeToMessage(message)[0]),
							);
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
	};

	const switchSelectedThread = (thread: Thread) => {
		setThreadSwitched(true);
		setChatStarted(true);

		// Set the thread ID in state. Then set in cookies so a new thread
		// isn't created on page load if one already exists.
		threadData.setThreadId(thread.thread_id);

		// Load thread state into separate state variables
		if (thread.values) {
			setMessages(thread.values?.messages || []);
			setState(thread.values as ThreadState);
		}
	};

	const contextValue: GraphContentType = {
		graphData: {
			isStreaming,
			error,
			messages,
			setMessages,
			state,
			setState,
			firstTokenReceived,
			chatStarted,
			setChatStarted,
			setIsStreaming,
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

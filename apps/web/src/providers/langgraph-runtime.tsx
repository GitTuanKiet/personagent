'use client';

import { useRef, useState } from 'react';
import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { useLangGraphRuntime } from '@assistant-ui/react-langgraph';

import { createThread, getThreadState, sendMessage } from '@/lib/chatApi';
import { usePlaygroundStore } from '@/store/playground';
import { toast } from 'sonner';

export function LangGraphRuntimeProvider({ children }: { children: React.ReactNode }) {
	const threadIdRef = useRef<string | undefined>(undefined);
	const [isConnected, setIsConnected] = useState(true);
	const [lastError, setLastError] = useState<string | null>(null);

	const { getPinnedPersona, getPinnedApplication } = usePlaygroundStore();

	const runtime = useLangGraphRuntime({
		threadId: threadIdRef.current,
		stream: async (messages) => {
			try {
				const pinnedApplication = getPinnedApplication();
				const pinnedPersona = getPinnedPersona();

				if (!pinnedPersona || !pinnedApplication) {
					toast.error('Please select a persona and application');
					return;
				}

				if (!threadIdRef.current) {
					const { thread_id } = await createThread({
						personaId: pinnedPersona.id,
						applicationId: pinnedApplication.id,
					});
					threadIdRef.current = thread_id;
				}
				const threadId = threadIdRef.current;

				const lastMessage = messages[messages.length - 1];

				setIsConnected(true);
				setLastError(null);
				return sendMessage({
					threadId,
					messages: [lastMessage],
					config: {
						persona: pinnedPersona,
						application: pinnedApplication,
					},
				});
			} catch (error) {
				console.error('LangGraph stream error:', error);
				setIsConnected(false);
				setLastError(error instanceof Error ? error.message : 'Unknown error');
				throw error;
			}
		},
		onSwitchToNewThread: async () => {
			try {
				const pinnedPersona = getPinnedPersona();
				const pinnedApplication = getPinnedApplication();

				if (!pinnedPersona || !pinnedApplication) {
					toast.error('Please select a persona and application');
					return;
				}

				const { thread_id } = await createThread({
					personaId: pinnedPersona.id,
					applicationId: pinnedApplication.id,
				});
				threadIdRef.current = thread_id;

				setIsConnected(true);
				setLastError(null);
			} catch (error) {
				console.error('LangGraph create thread error:', error);
				setIsConnected(false);
				setLastError(error instanceof Error ? error.message : 'Failed to create thread');
				throw error;
			}
		},
		onSwitchToThread: async (threadId) => {
			try {
				const state = await getThreadState(threadId);
				threadIdRef.current = threadId;
				setIsConnected(true);
				setLastError(null);
				return {
					messages: state.values?.messages || [],
					interrupts: state.tasks?.[0]?.interrupts,
				};
			} catch (error) {
				console.error('LangGraph switch thread error:', error);
				setIsConnected(false);
				setLastError(error instanceof Error ? error.message : 'Failed to switch thread');
				throw error;
			}
		},
	});

	return (
		<AssistantRuntimeProvider runtime={runtime}>
			{/* Connection status indicator */}
			{!isConnected && (
				<div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg animate-in slide-in-from-top-2 duration-300">
					<div className="flex items-center gap-2">
						<div className="w-2 h-2 bg-white rounded-full animate-pulse" />
						<div className="flex flex-col">
							<span className="text-sm font-medium">LangGraph Disconnected</span>
							{lastError && (
								<span className="text-xs opacity-80 max-w-64 truncate">{lastError}</span>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Success indicator */}
			{isConnected && threadIdRef.current && (
				<div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-3 py-1 rounded-md shadow-sm opacity-90">
					<div className="flex items-center gap-2">
						<div className="w-2 h-2 bg-white rounded-full" />
						<span className="text-xs font-medium">Connected</span>
					</div>
				</div>
			)}

			{children}
		</AssistantRuntimeProvider>
	);
}

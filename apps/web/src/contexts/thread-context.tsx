import { createClient } from '../hooks/utils';
import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { useAssistantContext } from './assistant-context';
import type { Thread } from '@/types';
import { toast } from 'sonner';
import { useQueryState } from 'nuqs';

type ThreadContentType = {
	userId: string;
	threadId: string | null;
	userThreads: Thread[];
	isUserThreadsLoading: boolean;
	createThreadLoading: boolean;
	getThread: (id: string) => Promise<Thread | undefined>;
	createThread: () => Promise<Thread | undefined>;
	getUserThreads: () => Promise<void>;
	deleteThread: (id: string, clearMessages: () => void) => Promise<void>;
	setThreadId: (id: string | null) => void;
};

const ThreadContext = createContext<ThreadContentType | undefined>(undefined);

export function ThreadProvider({
	children,
	visitorId,
}: {
	children: ReactNode;
	visitorId: string;
}) {
	const { selectedAssistant } = useAssistantContext();
	const [threadId, setThreadId] = useQueryState('threadId');
	const [userThreads, setUserThreads] = useState<Thread[]>([]);
	const [isUserThreadsLoading, setIsUserThreadsLoading] = useState(false);
	const [createThreadLoading, setCreateThreadLoading] = useState(false);

	const createThread = async (): Promise<Thread | undefined> => {
		if (!selectedAssistant) {
			toast.error('Please select an assistant', {
				description: 'Please select an assistant to create a thread.',
				duration: 5000,
			});
			return;
		}

		const client = createClient();
		setCreateThreadLoading(true);

		try {
			const thread = await client.threads.create({
				metadata: {
					user_id: visitorId,
					assistant_id: selectedAssistant.assistant_id,
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
					user_id: visitorId,
					...(selectedAssistant && { assistant_id: selectedAssistant.assistant_id }),
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
		userId: visitorId,
		threadId,
		userThreads,
		isUserThreadsLoading,
		createThreadLoading,
		getThread,
		createThread,
		getUserThreads,
		deleteThread,
		setThreadId,
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

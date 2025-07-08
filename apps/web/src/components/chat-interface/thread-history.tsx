import { isToday, isYesterday, isWithinInterval, subDays } from 'date-fns';
import { TooltipIconButton } from '../assistant-ui/tooltip-icon-button';
import { Button } from '@workspace/ui/components/button';
import { Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@workspace/ui/components/sheet';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { useEffect, useState } from 'react';
import type { Thread } from '@/types';
import { MessagesSquare } from 'lucide-react';
import { TighterText } from '../ui/tighter-text';
import { useGraphContext } from '@/contexts/graph-context';
import React from 'react';
import { useThreadContext } from '@/contexts/thread-context';

interface ThreadHistoryProps {
	switchSelectedThreadCallback: (thread: Thread) => void;
}

interface ThreadProps {
	id: string;
	onClick: () => void;
	onDelete: () => void;
	label: string;
	createdAt: Date;
}

const ThreadItem = (props: ThreadProps) => {
	const [isHovering, setIsHovering] = useState(false);

	return (
		<div
			className="flex flex-row items-center justify-start w-full"
			onMouseEnter={() => setIsHovering(true)}
			onMouseLeave={() => setIsHovering(false)}
		>
			<Button
				className="hover:bg-muted focus-visible:bg-muted rounded-lg transition-all focus-visible:ring-2 focus-visible:outline-none px-2 justify-start items-center flex-grow min-w-[191px] pr-0"
				size="sm"
				variant="ghost"
				onClick={props.onClick}
			>
				<TighterText className="truncate text-sm font-light w-full text-left">
					{props.label}
				</TighterText>
			</Button>
			{isHovering && (
				<TooltipIconButton tooltip="Delete thread" variant="ghost" onClick={props.onDelete}>
					<Trash2 className="w-12 h-12 text-[#575757] hover:text-red-500 transition-colors ease-in" />
				</TooltipIconButton>
			)}
		</div>
	);
};

const LoadingThread = () => <Skeleton className="w-full h-8" />;

const convertThreadActualToThreadProps = (
	thread: Thread,
	switchSelectedThreadCallback: (thread: Thread) => void,
	deleteThread: (id: string) => void,
): ThreadProps => ({
	id: thread.thread_id,
	label:
		thread.metadata?.thread_title ??
		((thread.values as Record<string, any>)?.messages?.[0]?.content || 'Untitled'),
	createdAt: new Date(thread.created_at),
	onClick: () => {
		return switchSelectedThreadCallback(thread);
	},
	onDelete: () => {
		return deleteThread(thread.thread_id);
	},
});

const groupThreads = (
	threads: Thread[],
	switchSelectedThreadCallback: (thread: Thread) => void,
	deleteThread: (id: string) => void,
) => {
	const today = new Date();
	const yesterday = subDays(today, 1);
	const sevenDaysAgo = subDays(today, 7);

	return {
		today: threads
			.filter((thread) => isToday(new Date(thread.created_at)))
			.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
			.map((t) => convertThreadActualToThreadProps(t, switchSelectedThreadCallback, deleteThread)),
		yesterday: threads
			.filter((thread) => isYesterday(new Date(thread.created_at)))
			.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
			.map((t) => convertThreadActualToThreadProps(t, switchSelectedThreadCallback, deleteThread)),
		lastSevenDays: threads
			.filter((thread) =>
				isWithinInterval(new Date(thread.created_at), {
					start: sevenDaysAgo,
					end: yesterday,
				}),
			)
			.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
			.map((t) => convertThreadActualToThreadProps(t, switchSelectedThreadCallback, deleteThread)),
		older: threads
			.filter((thread) => new Date(thread.created_at) < sevenDaysAgo)
			.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
			.map((t) => convertThreadActualToThreadProps(t, switchSelectedThreadCallback, deleteThread)),
	};
};

const prettifyDateLabel = (group: string): string => {
	switch (group) {
		case 'today':
			return 'Today';
		case 'yesterday':
			return 'Yesterday';
		case 'lastSevenDays':
			return 'Last 7 days';
		case 'older':
			return 'Older';
		default:
			return group;
	}
};

interface ThreadsListProps {
	groupedThreads: {
		today: ThreadProps[];
		yesterday: ThreadProps[];
		lastSevenDays: ThreadProps[];
		older: ThreadProps[];
	};
}

function ThreadsList(props: ThreadsListProps) {
	return (
		<div className="flex flex-col items-stretch gap-1.5 pt-3">
			{Object.entries(props.groupedThreads).map(([group, threads]) =>
				threads.length > 0 ? (
					<div key={group}>
						<TighterText className="text-sm font-medium mb-1 pl-2">
							{prettifyDateLabel(group)}
						</TighterText>
						<div className="flex flex-col gap-1">
							{threads.map((thread) => (
								<ThreadItem key={thread.id} {...thread} />
							))}
						</div>
					</div>
				) : null,
			)}
		</div>
	);
}

export function ThreadHistoryComponent(props: ThreadHistoryProps) {
	const {
		graphData: { switchSelectedThread, clearState },
	} = useGraphContext();
	const { deleteThread, getUserThreads, userThreads, isUserThreadsLoading } = useThreadContext();
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (typeof window == 'undefined' || userThreads.length) return;

		getUserThreads();
	}, [userThreads.length]);

	const handleDeleteThread = async (id: string) => {
		await deleteThread(id, () => clearState());
	};

	const groupedThreads = groupThreads(
		userThreads,
		(thread) => {
			switchSelectedThread(thread);
			props.switchSelectedThreadCallback(thread);
			setOpen(false);
		},
		handleDeleteThread,
	);

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<TooltipIconButton tooltip="History" variant="ghost" className="w-fit h-fit p-2">
					<MessagesSquare className="w-6 h-6 text-gray-600" strokeWidth={8} />
				</TooltipIconButton>
			</SheetTrigger>
			<SheetContent
				side="left"
				className="overflow-y-scroll scroll-smooth bg-inherit px-4 pt-8 border-none"
				aria-describedby={undefined}
			>
				<SheetTitle>
					<TighterText className="px-2 text-lg text-gray-600">Chat History</TighterText>
				</SheetTitle>

				{isUserThreadsLoading && !userThreads.length ? (
					<div className="flex flex-col gap-1 px-2 pt-3">
						{Array.from({ length: 25 }).map((_, i) => (
							<LoadingThread key={`loading-thread-${i}`} />
						))}
					</div>
				) : !userThreads.length ? (
					<p className="px-3 text-gray-500">No items found in history.</p>
				) : (
					<ThreadsList groupedThreads={groupedThreads} />
				)}
			</SheetContent>
		</Sheet>
	);
}

export const ThreadHistory = React.memo(ThreadHistoryComponent);

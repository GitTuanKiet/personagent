import { useGraphContext } from '@/contexts/graph-context';
import { ThreadPrimitive } from '@assistant-ui/react';
import type { Thread as ThreadType } from '@/types';
import { ArrowDownIcon, PanelRightOpen, SquarePen } from 'lucide-react';
import { Dispatch, FC, SetStateAction } from 'react';
import { TooltipIconButton } from '../assistant-ui/tooltip-icon-button';
import { TighterText } from '../ui/tighter-text';
import { Composer } from './composer';
import { AssistantMessage, UserMessage } from './messages';
import { ThreadHistory } from './thread-history';
import { ThreadWelcome } from './welcome';
import { useThreadContext } from '@/contexts/thread-context';

const ThreadScrollToBottom: FC = () => {
	return (
		<ThreadPrimitive.ScrollToBottom asChild>
			<TooltipIconButton
				tooltip="Scroll to bottom"
				variant="outline"
				className="absolute -top-8 rounded-full disabled:invisible"
			>
				<ArrowDownIcon />
			</TooltipIconButton>
		</ThreadPrimitive.ScrollToBottom>
	);
};

export interface ThreadProps {
	hasChatStarted: boolean;
	setChatStarted: Dispatch<SetStateAction<boolean>>;
	switchSelectedThreadCallback: (thread: ThreadType) => void;
	setChatCollapsed: (c: boolean) => void;
}

export const Thread: FC<ThreadProps> = (props: ThreadProps) => {
	const { setChatStarted, hasChatStarted, switchSelectedThreadCallback } = props;
	const {
		graphData: { clearState, state, chatStarted },
	} = useGraphContext();
	const { setThreadId } = useThreadContext();

	const handleNewSession = async () => {
		setThreadId(null);

		clearState();
		setChatStarted(false);
	};

	return (
		<ThreadPrimitive.Root className="flex flex-col h-full w-full">
			<div className="pr-3 pl-6 pt-3 pb-2 flex flex-row gap-4 items-center justify-between">
				<div className="flex items-center justify-start gap-2 text-gray-600">
					<ThreadHistory switchSelectedThreadCallback={switchSelectedThreadCallback} />
					<TighterText className="text-xl">Pag</TighterText>
				</div>
				{hasChatStarted ? (
					<div className="flex flex-row flex-1 gap-2 items-center justify-end">
						<TooltipIconButton
							tooltip="Collapse Chat"
							variant="ghost"
							className="w-8 h-8"
							delayDuration={400}
							onClick={() => props.setChatCollapsed(true)}
						>
							<PanelRightOpen className="text-gray-600" />
						</TooltipIconButton>
						<TooltipIconButton
							tooltip="New chat"
							variant="ghost"
							className="w-8 h-8"
							delayDuration={400}
							onClick={handleNewSession}
						>
							<SquarePen className="text-gray-600" />
						</TooltipIconButton>
					</div>
				) : null}
			</div>
			<ThreadPrimitive.Viewport className="flex-1 overflow-y-auto scroll-smooth bg-inherit px-4 pt-8">
				{!hasChatStarted && (
					<ThreadWelcome
						composer={<Composer chatStarted={false} isDone={false} />}
						chatStarted={hasChatStarted}
					/>
				)}
				<ThreadPrimitive.Messages
					components={{
						UserMessage: UserMessage,
						AssistantMessage: AssistantMessage,
					}}
				/>
			</ThreadPrimitive.Viewport>
			<div className="mt-4 flex w-full flex-col items-center justify-end rounded-t-lg bg-inherit pb-4 px-4">
				<ThreadScrollToBottom />
				<div className="w-full max-w-2xl">
					{hasChatStarted && (
						<div className="flex flex-col space-y-2">
							<Composer chatStarted={chatStarted} isDone={state.isDone} />
						</div>
					)}
				</div>
			</div>
		</ThreadPrimitive.Root>
	);
};

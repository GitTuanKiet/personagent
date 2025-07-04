import { useGraphContext } from '@/contexts/graph-context';
import { toast } from 'sonner';
import { ThreadPrimitive } from '@assistant-ui/react';
import type { Persona, Thread as ThreadType } from '@/types';
import { ArrowDownIcon, PanelRightOpen, SquarePen } from 'lucide-react';
import { Dispatch, FC, SetStateAction } from 'react';
import { useLangSmithLinkToolUI } from '../assistant-ui/tool-hook/LangSmithLinkToolUI';
import { TooltipIconButton } from '../assistant-ui/tooltip-icon-button';
import { TighterText } from '../ui/header';
import { Composer } from './composer';
import { AssistantMessage, UserMessage } from './messages';
import ModelSelector from './model-selector';
import { ThreadHistory } from './thread-history';
import { ThreadWelcome } from './welcome';
import { useUserContext } from '@/contexts/user-context';
import { useThreadContext } from '@/contexts/thread-context';
import { useAssistantContext } from '@/contexts/assistant-context';
import { useApplicationContext } from '@/contexts/application-context';

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
	userId: string | undefined;
	hasChatStarted: boolean;
	setChatStarted: Dispatch<SetStateAction<boolean>>;
	switchSelectedThreadCallback: (thread: ThreadType) => void;
	setChatCollapsed: (c: boolean) => void;
}

export const Thread: FC<ThreadProps> = (props: ThreadProps) => {
	const { setChatStarted, hasChatStarted, switchSelectedThreadCallback } = props;
	const {
		graphData: { clearState, runId, feedbackSubmitted, setFeedbackSubmitted },
	} = useGraphContext();
	const { modelName, setModelName, modelConfig, setModelConfig, modelConfigs, setThreadId } =
		useThreadContext();
	const { user } = useUserContext();

	useLangSmithLinkToolUI();

	const handleNewSession = async () => {
		if (!user) {
			toast.error('Failed to create thread without user', {
				description: 'User not found',
				duration: 5000,
			});
			return;
		}

		// Remove the threadId param from the URL
		setThreadId(null);

		setModelName(modelName);
		setModelConfig(modelName, modelConfig);
		clearState();
		setChatStarted(false);
	};

	return (
		<ThreadPrimitive.Root className="flex flex-col h-full w-full">
			<div className="pr-3 pl-6 pt-3 pb-2 flex flex-row gap-4 items-center justify-between">
				<div className="flex items-center justify-start gap-2 text-gray-600">
					<ThreadHistory switchSelectedThreadCallback={switchSelectedThreadCallback} />
					<TighterText className="text-xl">Pag</TighterText>
					{!hasChatStarted && (
						<ModelSelector
							modelName={modelName}
							setModelName={setModelName}
							modelConfig={modelConfig}
							setModelConfig={setModelConfig}
							modelConfigs={modelConfigs}
						/>
					)}
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
						composer={<Composer chatStarted={false} userId={props.userId} />}
						userId={props.userId}
						chatStarted={hasChatStarted}
					/>
				)}
				<ThreadPrimitive.Messages
					components={{
						UserMessage: UserMessage,
						AssistantMessage: (prop) => (
							<AssistantMessage
								{...prop}
								feedbackSubmitted={feedbackSubmitted}
								setFeedbackSubmitted={setFeedbackSubmitted}
								runId={runId}
							/>
						),
					}}
				/>
			</ThreadPrimitive.Viewport>
			<div className="mt-4 flex w-full flex-col items-center justify-end rounded-t-lg bg-inherit pb-4 px-4">
				<ThreadScrollToBottom />
				<div className="w-full max-w-2xl">
					{hasChatStarted && (
						<div className="flex flex-col space-y-2">
							<ModelSelector
								modelName={modelName}
								setModelName={setModelName}
								modelConfig={modelConfig}
								setModelConfig={setModelConfig}
								modelConfigs={modelConfigs}
							/>
							<Composer chatStarted={true} userId={props.userId} />
						</div>
					)}
				</div>
			</div>
		</ThreadPrimitive.Root>
	);
};

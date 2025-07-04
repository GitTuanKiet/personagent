'use client';

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@workspace/ui/components/accordion';
import {
	ActionBarPrimitive,
	getExternalStoreMessages,
	MessagePrimitive,
	MessageState,
	useMessage,
} from '@assistant-ui/react';
import React, { Dispatch, SetStateAction, type FC } from 'react';

import { MarkdownText } from '@/components/assistant-ui/markdown-text';
import { Avatar, AvatarFallback } from '@workspace/ui/components/avatar';
import { FeedbackButton } from './feedback';
import { TighterText } from '../ui/header';
import { useFeedback } from '@/hooks/use-feedback';
import { HumanMessage } from '@langchain/core/messages';
import { Button } from '@workspace/ui/components/button';
import { Globe } from 'lucide-react';
import { useQueryState } from 'nuqs';

export const OC_HIDE_FROM_UI_KEY = '__oc_hide_from_ui';

interface AssistantMessageProps {
	runId: string | undefined;
	feedbackSubmitted: boolean;
	setFeedbackSubmitted: Dispatch<SetStateAction<boolean>>;
}

const ThinkingAssistantMessageComponent = ({
	message,
}: {
	message: MessageState;
}): React.ReactElement => {
	const { id, content } = message;
	let contentText = '';
	if (typeof content === 'string') {
		contentText = content;
	} else {
		const firstItem = content?.[0];
		if (firstItem?.type === 'text') {
			contentText = firstItem.text;
		}
	}

	if (contentText === '') {
		return <></>;
	}

	return (
		<Accordion defaultValue={`accordion-${id}`} type="single" collapsible className="w-full">
			<AccordionItem value={`accordion-${id}`}>
				<AccordionTrigger>Thoughts</AccordionTrigger>
				<AccordionContent>{contentText}</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
};

const ThinkingAssistantMessage = React.memo(ThinkingAssistantMessageComponent);

export const AssistantMessage: FC<AssistantMessageProps> = ({
	runId,
	feedbackSubmitted,
	setFeedbackSubmitted,
}) => {
	const message = useMessage();
	const { isLast } = message;
	const isThinkingMessage = message.id.startsWith('thinking-');

	if (isThinkingMessage) {
		return <ThinkingAssistantMessage message={message} />;
	}

	return (
		<MessagePrimitive.Root className="relative grid w-full max-w-2xl grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] py-4">
			<Avatar className="col-start-1 row-span-full row-start-1 mr-4">
				<AvatarFallback>A</AvatarFallback>
			</Avatar>

			<div className="text-foreground col-span-2 col-start-2 row-start-1 my-1.5 max-w-xl break-words leading-7">
				<MessagePrimitive.Content components={{ Text: MarkdownText }} />
				{isLast && runId && (
					<MessagePrimitive.If lastOrHover assistant>
						<AssistantMessageBar
							feedbackSubmitted={feedbackSubmitted}
							setFeedbackSubmitted={setFeedbackSubmitted}
							runId={runId}
						/>
					</MessagePrimitive.If>
				)}
			</div>
		</MessagePrimitive.Root>
	);
};

export const UserMessage: FC = () => {
	const msg = useMessage(getExternalStoreMessages<HumanMessage>);
	const humanMessage = Array.isArray(msg) ? msg[0] : msg;

	if (humanMessage?.additional_kwargs?.[OC_HIDE_FROM_UI_KEY]) return null;

	return (
		<MessagePrimitive.Root className="grid w-full max-w-2xl auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 py-4">
			<div className="bg-muted text-foreground col-start-2 row-start-2 max-w-xl break-words rounded-3xl px-5 py-2.5">
				<MessagePrimitive.Content />
			</div>
		</MessagePrimitive.Root>
	);
};

interface AssistantMessageBarProps {
	runId: string;
	feedbackSubmitted: boolean;
	setFeedbackSubmitted: Dispatch<SetStateAction<boolean>>;
}

const AssistantMessageBarComponent = ({
	runId,
	feedbackSubmitted,
	setFeedbackSubmitted,
}: AssistantMessageBarProps) => {
	const { isLoading, sendFeedback } = useFeedback();
	return (
		<ActionBarPrimitive.Root hideWhenRunning autohide="not-last" className="flex items-center mt-2">
			{feedbackSubmitted ? (
				<TighterText className="text-gray-500 text-sm">Feedback received! Thank you!</TighterText>
			) : (
				<>
					<ActionBarPrimitive.FeedbackPositive asChild>
						<FeedbackButton
							isLoading={isLoading}
							sendFeedback={sendFeedback}
							setFeedbackSubmitted={setFeedbackSubmitted}
							runId={runId}
							feedbackValue={1.0}
							icon="thumbs-up"
						/>
					</ActionBarPrimitive.FeedbackPositive>
					<ActionBarPrimitive.FeedbackNegative asChild>
						<FeedbackButton
							isLoading={isLoading}
							sendFeedback={sendFeedback}
							setFeedbackSubmitted={setFeedbackSubmitted}
							runId={runId}
							feedbackValue={0.0}
							icon="thumbs-down"
						/>
					</ActionBarPrimitive.FeedbackNegative>
				</>
			)}
		</ActionBarPrimitive.Root>
	);
};

const AssistantMessageBar = React.memo(AssistantMessageBarComponent);

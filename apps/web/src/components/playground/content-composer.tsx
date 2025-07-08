'use client';

import { toast } from 'sonner';
import { convertLangchainMessages, convertToOpenAIFormat } from '@/lib/messages';
import {
	AppendMessage,
	AssistantRuntimeProvider,
	useExternalMessageConverter,
	useExternalStoreRuntime,
} from '@assistant-ui/react';
import { BaseMessage, HumanMessage } from '@langchain/core/messages';
import type { Thread as ThreadType } from '@/types';
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Thread } from '@/components/chat-interface';
import { useGraphContext } from '@/contexts/graph-context';
import { CompositeAttachmentAdapter, SimpleTextAttachmentAdapter } from '@assistant-ui/react';
import { useThreadContext } from '@/contexts/thread-context';

export interface ContentComposerChatInterfaceProps {
	switchSelectedThreadCallback: (thread: ThreadType) => void;
	setChatStarted: React.Dispatch<React.SetStateAction<boolean>>;
	hasChatStarted: boolean;
	chatCollapsed: boolean;
	setChatCollapsed: (c: boolean) => void;
}

export function ContentComposerChatInterfaceComponent(
	props: ContentComposerChatInterfaceProps,
): React.ReactElement {
	const { graphData } = useGraphContext();
	const { messages, setMessages, streamMessage, setIsStreaming } = graphData;
	const { getUserThreads } = useThreadContext();
	const [isRunning, setIsRunning] = useState(false);

	async function onNew(message: AppendMessage): Promise<void> {
		// Explicitly check for false and not ! since this does not provide a default value
		// so we should assume undefined is true.
		if (message.startRun === false) return;

		if (message.content?.[0]?.type !== 'text') {
			toast.error('Only text messages are supported', {
				duration: 5000,
			});
			return;
		}
		props.setChatStarted(true);
		setIsRunning(true);
		setIsStreaming(true);

		try {
			const humanMessage = new HumanMessage({
				content: message.content[0].text,
				id: uuidv4(),
			});

			setMessages((prevMessages) => [...prevMessages, humanMessage]);

			await streamMessage({
				messages: [convertToOpenAIFormat(humanMessage)],
			});
		} finally {
			setIsRunning(false);
			// Re-fetch threads so that the current thread's title is updated.
			await getUserThreads();
		}
	}

	const threadMessages = useExternalMessageConverter<BaseMessage>({
		callback: convertLangchainMessages,
		messages,
		isRunning,
		joinStrategy: 'none',
	});

	const runtime = useExternalStoreRuntime({
		messages: threadMessages,
		isRunning,
		onNew,
		adapters: {
			attachments: new CompositeAttachmentAdapter([new SimpleTextAttachmentAdapter()]),
		},
	});

	return (
		<div className="h-full w-full">
			<AssistantRuntimeProvider runtime={runtime}>
				<Thread
					setChatStarted={props.setChatStarted}
					hasChatStarted={props.hasChatStarted}
					switchSelectedThreadCallback={props.switchSelectedThreadCallback}
					setChatCollapsed={props.setChatCollapsed}
				/>
			</AssistantRuntimeProvider>
		</div>
	);
}

export const ContentComposerChatInterface = React.memo(ContentComposerChatInterfaceComponent);

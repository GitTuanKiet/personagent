'use client';

import { getExternalStoreMessages, MessagePrimitive, useMessage } from '@assistant-ui/react';
import React, { type FC } from 'react';

import { MarkdownText } from '@/components/assistant-ui/markdown-text';
import { Avatar, AvatarFallback } from '@workspace/ui/components/avatar';
import { HumanMessage } from '@langchain/core/messages';

export const OC_HIDE_FROM_UI_KEY = '__oc_hide_from_ui';

export const AssistantMessage: FC = () => {
	return (
		<MessagePrimitive.Root className="relative grid w-full max-w-[var(--thread-max-width)] grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] py-4">
			<Avatar className="col-start-1 row-span-full row-start-1 mr-4">
				<AvatarFallback>A</AvatarFallback>
			</Avatar>

			<div className="text-foreground col-span-2 col-start-2 row-start-1 my-1.5 max-w-[calc(var(--thread-max-width)*0.8)] break-words leading-7">
				<MessagePrimitive.Content components={{ Text: MarkdownText }} />
			</div>
		</MessagePrimitive.Root>
	);
};

export const UserMessage: FC = () => {
	const msg = useMessage(getExternalStoreMessages<HumanMessage>);
	const humanMessage = Array.isArray(msg) ? msg[0] : msg;

	if (humanMessage?.additional_kwargs?.[OC_HIDE_FROM_UI_KEY]) return null;

	return (
		<MessagePrimitive.Root className="grid w-full max-w-[var(--thread-max-width)] auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 py-4">
			<div className="bg-muted text-foreground col-start-2 row-start-2 max-w-[calc(var(--thread-max-width)*0.8)] break-words rounded-3xl px-5 py-2.5">
				<MessagePrimitive.Content />
			</div>
		</MessagePrimitive.Root>
	);
};

import React, { memo } from 'react';
import { Avatar, AvatarFallback } from '@workspace/ui/components/avatar';
import { BotIcon } from 'lucide-react';
import { MessageItemProps } from './types';
import { renderMessageContent } from './utils/messageRenderer';

export const MessageItem: React.FC<MessageItemProps> = memo(({ message, index }) => {
	const isUser = message.getType() === 'human';
	const isAI = message.getType() === 'ai';
	const isSystem = !isUser && !isAI;

	return (
		<div
			key={message.id || index}
			className={`flex gap-2 items-end ${isUser ? 'flex-row-reverse' : ''}`}
		>
			{/* Avatar - only show for AI and system messages */}
			{!isUser && (
				<Avatar className="w-6 h-6 mb-1">
					<AvatarFallback className="text-xs">{isAI ? <BotIcon size={10} /> : 'S'}</AvatarFallback>
				</Avatar>
			)}

			{/* Message Content */}
			<div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} flex-1`}>
				{/* System messages get different styling */}
				{isSystem ? (
					<div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-800 max-w-md mx-auto">
						<p className="whitespace-pre-wrap">{String(message.content)}</p>
					</div>
				) : (
					renderMessageContent(message.content, isUser)
				)}

				{/* Timestamp */}
				{message.response_metadata?.timestamp && (
					<span className="text-xs text-gray-400 mt-1 px-1">
						{new Date(message.response_metadata.timestamp).toLocaleTimeString()}
					</span>
				)}
			</div>
		</div>
	);
});

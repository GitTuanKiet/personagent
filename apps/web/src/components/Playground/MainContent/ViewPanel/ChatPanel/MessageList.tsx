import React, { memo } from 'react';
import { MessageListProps } from './types';
import { MessageItem } from './MessageItem';

export const MessageList: React.FC<MessageListProps> = memo(({ messages }) => {
	return (
		<>
			{messages.map((message, index) => (
				<MessageItem key={message.id || index} message={message} index={index} />
			))}
		</>
	);
});

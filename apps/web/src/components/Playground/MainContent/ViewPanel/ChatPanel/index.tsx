'use client';

import { useRef, useEffect } from 'react';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { MessageCircleIcon } from 'lucide-react';
import { usePlaygroundStore } from '@/store/playground';
import { TaskSection } from './TaskSection';
import { MessageList } from './MessageList';

export default function ChatPanel() {
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Get data from playground store
	const { getPinnedSimulation } = usePlaygroundStore();

	const pinnedSimulation = getPinnedSimulation();
	const messages = pinnedSimulation?.state?.messages || [];

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	return (
		<div className="flex flex-col h-full">
			{/* Chat Messages */}
			<ScrollArea className="flex-1 p-4">
				<div className="space-y-2">
					{/* Task Section - displays task or input based on simulation state */}
					<TaskSection simulation={pinnedSimulation} />

					{messages.length === 0 && !pinnedSimulation ? (
						<div className="text-center text-muted-foreground py-8">
							<MessageCircleIcon size={32} className="mx-auto mb-2 opacity-50" />
							<p>Agent conversation will appear here</p>
							<p className="text-xs mt-1">Start a simulation to see real-time interactions</p>
						</div>
					) : (
						<MessageList messages={messages} />
					)}
					<div ref={messagesEndRef} />
				</div>
			</ScrollArea>
		</div>
	);
}

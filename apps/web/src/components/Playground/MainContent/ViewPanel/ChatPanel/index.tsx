'use client';

import { usePlaygroundStore } from '@/store/playground';
import { TaskSection } from './TaskSection';
import { MessagesSection } from './MessagesSection';
import { coerceMessageLikeToMessage } from '@langchain/core/messages';

export default function ChatPanel() {
	// Get data from playground store
	const currentSimulation = usePlaygroundStore((state) => state.currentSimulation);
	const taskInput = usePlaygroundStore((state) => state.taskInput);
	const messages = (currentSimulation?.state?.messages || []).map(coerceMessageLikeToMessage);

	return (
		<div className="flex flex-col h-full bg-slate-50">
			{/* Task Section - Fixed at top */}
			<div className="flex-shrink-0">
				<TaskSection simulation={currentSimulation} />
			</div>

			{/* Messages Section - Scrollable, takes remaining space */}
			<div className="flex-1 min-h-0">
				<MessagesSection messages={messages} hasSimulation={!!currentSimulation} />
			</div>
		</div>
	);
}

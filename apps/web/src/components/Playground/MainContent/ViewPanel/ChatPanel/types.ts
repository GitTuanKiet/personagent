import type { BaseMessage, MessageContent, MessageContentComplex } from '@langchain/core/messages';
import { SimulationSelect } from '@/database/client/schema';

export interface ChatSimulation {
	id: string;
	task: string;
	status: string;
	createdAt: string;
	state?: {
		messages?: BaseMessage[];
	};
}

export interface TaskDisplayProps {
	simulation?: SimulationSelect | null;
}

export interface MessageListProps {
	messages: BaseMessage[];
}

export interface MessageItemProps {
	message: BaseMessage;
	index: number;
}

export { MessageContent, MessageContentComplex };

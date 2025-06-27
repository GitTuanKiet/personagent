import {
	Client,
	ThreadState as DefaultThreadState,
	MessagesTupleStreamEvent,
	Metadata,
	Thread as LangGraphThread,
} from '@langchain/langgraph-sdk';
import { LangChainMessage } from '@assistant-ui/react-langgraph';
import type { ToolCall } from '@langchain/core/messages/tool';
import { ApplicationSelect, PersonaSelect } from '@/database/client/schema';

export type BrowserToolCall = Omit<ToolCall, 'name'> & {
	name: string;
};

export type UsabilityIssue = {
	description: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
	impact: 'minor' | 'moderate' | 'major' | 'blocker';
	recommendation: string;
	context: string;
	category: 'navigation' | 'forms' | 'content' | 'accessibility' | 'errors' | 'performance';
};

export type ThreadState = DefaultThreadState<{
	messages: LangChainMessage[];
	actions: BrowserToolCall[];
	scripts: Record<number, BrowserToolCall[]>;
	nSteps: number;
	streamUrl: string | undefined;
	isDone: boolean;
	isSimulatedPrompt: boolean;
	usabilityIssues: UsabilityIssue[];
}>;

export type Thread = LangGraphThread<ThreadState>;

export interface SendMessageParams {
	threadId: string;
	messages: LangChainMessage[];
	config: {
		model?: string;
		persona: PersonaSelect;
		application: ApplicationSelect;
	};
}

export interface CreateThreadParams {
	personaId: number;
	applicationId: number;
}

const createClient = () => {
	const apiUrl =
		process.env['NEXT_PUBLIC_LANGGRAPH_API_URL'] || typeof window !== 'undefined'
			? window.location.origin + '/api'
			: '/api';

	return new Client({
		apiUrl,
	});
};

export const createThread = async (params: CreateThreadParams): Promise<{ thread_id: string }> => {
	const client = createClient();
	return client.threads.create({
		metadata: {
			...params,
		},
	});
};

export const getThreadState = async (threadId: string): Promise<ThreadState> => {
	const client = createClient();
	return client.threads.getState(threadId);
};

export const sendMessage = async function* (
	params: SendMessageParams,
): AsyncGenerator<MessagesTupleStreamEvent> {
	const client = createClient();

	return client.runs.stream(params.threadId, process.env['NEXT_PUBLIC_LANGGRAPH_ASSISTANT_ID']!, {
		input: {
			messages: params.messages,
		},
		streamMode: 'messages-tuple',
		config: {
			configurable: {
				model: params.config.model,
				persona: params.config.persona,
				useVision: params.config.application.useVision,
				browserProfile: {
					allowedDomains: params.config.application.allowedDomains,
					blockedDomains: params.config.application.blockedDomains,
					env: params.config.application.env,
					headers: params.config.application.headers,
					timeout: params.config.application.timeout,
				},
				sessionId: params.config.application.fingerprint + params.config.application.id,
			},
			recursion_limit: params.config.application.recursionLimit ?? 100,
		},
	});
};

export const listThreads = async (query?: {
	metadata?: Metadata;
	page?: number;
}): Promise<Thread[]> => {
	const client = createClient();
	return client.threads.search({
		...query,
		limit: 10,
		offset: (query?.page ?? 1) * 10,
	});
};

export const deleteThread = async (threadId: string): Promise<void> => {
	const client = createClient();
	return client.threads.delete(threadId);
};

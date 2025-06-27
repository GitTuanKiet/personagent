/**
 * Define the state schema for the agent.
 */
import type { ToolCall } from '@langchain/core/messages/tool';
import { Annotation, MessagesAnnotation } from '@langchain/langgraph';

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

export const BUAAnnotation = Annotation.Root({
	/**
	 * The message list between the user & assistant.
	 */
	messages: MessagesAnnotation.spec.messages,
	/**
	 * List of actions to perform.
	 */
	actions: Annotation<BrowserToolCall[]>({
		reducer: (_state, update) => update,
		default: () => [],
	}),
	/**
	 * The script stored performed actions.
	 */
	scripts: Annotation<Record<number, BrowserToolCall[]>>({
		reducer: (state, update) => {
			for (const step of Object.keys(update).map(Number)) {
				if (state[step]) {
					const ids = new Set(state[step].map((action) => action.id));
					state[step] = [
						...state[step],
						...(update[step] ?? []).filter((action) => !ids.has(action.id)),
					];
				} else {
					state[step] = update[step] ?? [];
				}
			}
			return state;
		},
		default: () => ({}),
	}),
	/**
	 * The number of steps taken.
	 */
	nSteps: Annotation<number>({
		reducer: (_state, update) => update,
		default: () => 0,
	}),
	/**
	 * The stream URL of the browser session to use for this thread.
	 */
	streamUrl: Annotation<string | undefined>({
		reducer: (_state, update) => update,
		default: () => undefined,
	}),
	/**
	 * Whether the agent has completed its task.
	 */
	isDone: Annotation<boolean>({
		reducer: (state, update) => update ?? state,
		default: () => false,
	}),
	/**
	 * Whether the prompt is valid.
	 */
	isSimulatedPrompt: Annotation<boolean>({
		reducer: (_state, update) => update,
		default: () => false,
	}),
	/**
	 * Usability issues found during the session analysis.
	 */
	usabilityIssues: Annotation<UsabilityIssue[]>({
		reducer: (_state, update) => update,
		default: () => [],
	}),
});

export type BUAState = typeof BUAAnnotation.State;
export type BUAUpdate = typeof BUAAnnotation.Update;

import { Annotation, MessagesAnnotation } from '@langchain/langgraph';
import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import type { SystemMessage } from '@langchain/core/messages';
import type { BrowserProfileOptions } from './browser/profile';
import type { BrowserToolCall } from './utils';

// Copied from the OpenAI example repository
// https://github.com/openai/openai-cua-sample-app/blob/eb2d58ba77ffd3206d3346d6357093647d29d99c/utils.py#L13
export const BLOCKED_DOMAINS = [
	'maliciousbook.com',
	'evilvideos.com',
	'darkwebforum.com',
	'shadytok.com',
	'suspiciouspins.com',
	'ilanbigio.com',
];

export const DEFAULT_ATTRIBUTES = [
	'title',
	'type',
	'name',
	'role',
	'aria-label',
	'placeholder',
	'value',
	'alt',
	'aria-expanded',
	'data-date-format',
];

export const DEFAULT_MODEL = 'gpt-4o-mini';

export type BrowserToolCallResult = {
	action: BrowserToolCall['name'];
	result: string;
};

export const BUAAnnotation = Annotation.Root({
	/**
	 * The message list between the user & assistant. This contains
	 * messages, excluding the browser tool calls (except for the thinking tool).
	 */
	messages: MessagesAnnotation.spec.messages,
	/**
	 * The id of the browser session to use for this thread.
	 * @default undefined
	 */
	sessionId: Annotation<string | undefined>({
		reducer: (state, update) => update ?? state,
		default: () => undefined,
	}),
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
					state[step] = state[step].concat(update[step] ?? []);
				} else {
					state[step] = update[step] ?? [];
				}
			}
			return state;
		},
		default: () => ({}),
	}),
	/**
	 * List of results from the actions.
	 */
	results: Annotation<BrowserToolCallResult[]>({
		reducer: (state, update) => state.concat(update),
		default: () => [],
	}),
	/**
	 * The number of steps taken.
	 */
	nSteps: Annotation<number>({
		reducer: (_state, update) => update,
		default: () => 0,
	}),
});

export const BUAConfigurable = Annotation.Root({
	/**
	 * The model to use for the browser actions.
	 */
	model: Annotation<string>({
		reducer: (_state, update) => update,
		default: () => DEFAULT_MODEL,
	}),
	/**
	 * The attributes to include in the browser state.
	 */
	includeAttributes: Annotation<string[]>({
		reducer: (_state, update) => update,
		default: () => DEFAULT_ATTRIBUTES,
	}),
	/**
	 * Whether to use vision model to capture the screen.
	 */
	useVision: Annotation<boolean>({
		reducer: (_state, update) => update,
		default: () => false,
	}),
	/**
	 * The system prompt to use when calling the model.
	 */
	prompt: Annotation<string | SystemMessage | undefined>({
		reducer: (_state, update) => update,
		default: () => undefined,
	}),
	/**
	 * The WSS URL to use for the browser instance.
	 */
	wssUrl: Annotation<string | undefined>({
		reducer: (_state, update) => update,
		default: () => undefined,
	}),
	/**
	 * The CDP URL to use for the browser instance.
	 */
	cdpUrl: Annotation<string | undefined>({
		reducer: (_state, update) => update,
		default: () => undefined,
	}),
	/**
	 * The browser profile options.
	 */
	browserProfile: Annotation<BrowserProfileOptions>({
		reducer: (state, update) => ({ ...state, ...update }),
		default: () => ({
			blockedDomains: BLOCKED_DOMAINS,
		}),
	}),
});

/**
 * Gets the configuration with default values.
 *
 * @param {LangGraphRunnableConfig} config - The configuration to use.
 * @returns {typeof BUAConfigurable.State} - The configuration with default values.
 */
export function getConfigurationWithDefaults(
	config: LangGraphRunnableConfig,
): typeof BUAConfigurable.State {
	return {
		model: config.configurable?.model ?? 'gpt-4o-mini',
		includeAttributes: config.configurable?.includeAttributes ?? DEFAULT_ATTRIBUTES,
		useVision: config.configurable?.useVision ?? false,
		prompt: config.configurable?.prompt ?? undefined,
		wssUrl: config.configurable?.wssUrl ?? undefined,
		cdpUrl: config.configurable?.cdpUrl ?? undefined,
		browserProfile: config.configurable?.browserProfile ?? {
			blockedDomains: BLOCKED_DOMAINS,
		},
	};
}

export type BUAState = typeof BUAAnnotation.State;
export type BUAUpdate = typeof BUAAnnotation.Update;

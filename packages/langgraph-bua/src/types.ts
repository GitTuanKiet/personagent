import { Annotation, MessagesAnnotation } from '@langchain/langgraph';
import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import type { SystemMessage } from '@langchain/core/messages';
import type { IBrowserProfile } from 'pag-browser';
import type { BrowserToolCall } from './utils';
import { join } from 'node:path';

function getUserDataDir(user?: string) {
	const homeVarName = process.platform === 'win32' ? 'USERPROFILE' : 'HOME';
	const userHome = process.env.USER_DATA_DIR ?? process.env[homeVarName] ?? process.cwd();

	return join(userHome, '.browser', user ?? '');
}

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
	 * The pid of the browser process.
	 */
	browserPid: Annotation<number | undefined>({
		reducer: (_state, update) => update,
		default: () => undefined,
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
		reducer: (_state, update) =>
			Array.from(new Set([...DEFAULT_ATTRIBUTES, ...(Array.isArray(update) ? update : [update])])),
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
	 * The browser profile options.
	 */
	browserProfile: Annotation<IBrowserProfile>({
		reducer: (state, update) => ({ ...state, ...update }),
		default: () => ({
			blockedDomains: BLOCKED_DOMAINS,
		}),
	}),
	/**
	 * The id of the browser session to use for this thread.
	 */
	sessionId: Annotation<string>({
		reducer: (state, update) => update ?? state,
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
	const sessionId = config.configurable?.sessionId ?? undefined;
	if (!sessionId) {
		throw new Error('sessionId is required');
	}
	const userDataDir = getUserDataDir(String(sessionId));
	return {
		model: config.configurable?.model ?? 'gpt-4o-mini',
		includeAttributes: Array.from(
			new Set([...DEFAULT_ATTRIBUTES, ...(config.configurable?.includeAttributes ?? [])]),
		),
		useVision: config.configurable?.useVision ?? false,
		prompt: config.configurable?.prompt ?? undefined,
		browserProfile: {
			blockedDomains: BLOCKED_DOMAINS,
			...config.configurable?.browserProfile,
			userDataDir,
		},
		sessionId,
	};
}

export type BUAState = typeof BUAAnnotation.State;
export type BUAUpdate = typeof BUAAnnotation.Update;

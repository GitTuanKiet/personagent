/**
 * Define the configurable parameters for the agent.
 */
import { join } from 'node:path';
import { Annotation } from '@langchain/langgraph';
import type { RunnableConfig } from '@langchain/core/runnables';
import type { IBrowserProfile } from '../browser/index.js';

// Define persona types
export type AgeGroup = 'teen' | 'adult' | 'senior';
export type DigitalSkillLevel = 'low' | 'medium' | 'high';
export type BehaviorTrait =
	| 'cautious'
	| 'impatient'
	| 'detail-oriented'
	| 'exploratory'
	| 'task-focused'
	| 'distracted'
	| 'hesitatesWithForms'
	| 'ignoresSmallText'
	| 'scrollAverse'
	| 'prefersTextOverIcon'
	| string;

export type Language = 'vietnamese' | 'english';

export interface PersonaConfiguration {
	name: string;
	description?: string;
	ageGroup?: AgeGroup;
	digitalSkillLevel?: DigitalSkillLevel;
	behaviorTraits?: BehaviorTrait[];
	preferences?: Record<string, any>;
	language: Language;
}

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
	 * The persona configuration for this session.
	 */
	persona: Annotation<PersonaConfiguration | undefined>({
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

export function ensureConfiguration(config: RunnableConfig): typeof BUAConfigurable.State {
	/**
	 * Ensure the defaults are populated.
	 */
	const configurable = config.configurable ?? {};
	const sessionId = config.configurable?.sessionId ?? undefined;
	if (!sessionId) {
		throw new Error('sessionId is required');
	}
	const userDataDir = getUserDataDir(String(sessionId));
	return {
		model: configurable?.model ?? 'gpt-4o-mini',
		includeAttributes: Array.from(
			new Set([...DEFAULT_ATTRIBUTES, ...(configurable?.includeAttributes ?? [])]),
		),
		useVision: configurable?.useVision ?? false,
		persona: configurable?.persona ?? undefined,
		browserProfile: {
			blockedDomains: BLOCKED_DOMAINS,
			...configurable?.browserProfile,
			userDataDir,
		},
		sessionId,
	};
}

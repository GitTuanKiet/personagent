import type z from 'zod';
import type { Page } from 'patchright';
import type { RunnableConfig } from '@langchain/core/runnables';
import { getConfig } from '@langchain/langgraph';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { browserContainer, BrowserManager } from 'pag-browser';
import { getConfigurationWithDefaults } from '../types';
import type { MessageContentComplex } from '@langchain/core/messages';

export type ActionResult = MessageContentComplex[];

export type DynamicStructuredActionFields<Input extends z.ZodTypeAny = z.ZodTypeAny> =
	ConstructorParameters<
		typeof DynamicStructuredTool<Input, z.output<Input>, z.input<Input>, ActionResult>
	>[0] & {
		pageMatcher?: (page: Page) => boolean;
	};

export class DynamicStructuredAction<
	Input extends z.ZodTypeAny = z.ZodTypeAny,
> extends DynamicStructuredTool<Input, z.output<Input>, z.input<Input>, ActionResult> {
	pageMatcher?: (page: Page) => boolean;

	constructor(fields: DynamicStructuredActionFields<Input>) {
		const { pageMatcher, ...rest } = fields;
		super(rest);
		this.pageMatcher = pageMatcher;
	}

	static async getBrowserSession(config?: RunnableConfig<Record<string, any>>) {
		const { sessionId, browserProfile } = getConfigurationWithDefaults(config ?? getConfig());
		return browserContainer.get(BrowserManager).getOrCreateSession({ sessionId, browserProfile });
	}
}

export class BrowserCallToolError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'BrowserCallToolError';
	}
}

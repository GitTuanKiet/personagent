import type z from 'zod';
import type { Page } from 'playwright';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { browserContainer, BrowserAction } from '../browser';

export function getBrowserInstance() {
	return browserContainer.get(BrowserAction);
}

export type DynamicStructuredActionFields<Input extends z.AnyZodObject> = ConstructorParameters<
	typeof DynamicStructuredTool<Input, z.output<Input>, z.input<Input>, string>
>[0] & {
	pageMatcher?: (page: Page) => boolean;
};

export class DynamicStructuredAction<Input extends z.AnyZodObject> extends DynamicStructuredTool<
	Input,
	z.output<Input>,
	z.input<Input>,
	string
> {
	pageMatcher?: (page: Page) => boolean;

	constructor(fields: DynamicStructuredActionFields<Input>) {
		const { pageMatcher, ...rest } = fields;
		super(rest);
		this.pageMatcher = pageMatcher;
	}
}

export class BrowserCallToolError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'BrowserCallToolError';
	}
}

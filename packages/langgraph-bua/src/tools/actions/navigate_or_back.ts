import { z } from 'zod';
import { DynamicStructuredAction, type ActionResult } from '../base';

export const navigateOrBackAction = new DynamicStructuredAction({
	name: 'navigate_or_back',
	description: 'Navigate to a URL or go back',
	schema: z
		.object({
			action: z.enum(['go_back', 'to_url']).describe('The action to perform'),
			to_url: z
				.string()
				.optional()
				.describe('The URL to navigate to. Required if action is to_url'),
			wait_until: z
				.enum(['load', 'domcontentloaded', 'networkidle'])
				.default('networkidle')
				.describe('The wait until condition'),
		})
		.superRefine((val, ctx) => {
			if (val.action === 'to_url' && !val.to_url) {
				ctx.addIssue({
					path: ['to_url'],
					code: z.ZodIssueCode.custom,
					message: 'to_url is required when action is "to_url"',
				});
			}
		}),
	func: async (input, _runManager, config) => {
		const instance = await DynamicStructuredAction.getBrowserSession(config);
		const content: ActionResult = [];

		switch (input.action) {
			case 'go_back': {
				await instance.goBack();
				const msg = '🔙  Navigated back';
				content.push({ type: 'text', text: msg });
				break;
			}
			case 'to_url': {
				if (!input.to_url) throw new Error('Missing to_url for navigate_or_back action');
				let page = await instance.getCurrentPage();
				if (page) {
					await page.goto(input.to_url);
				} else {
					page = await instance.createNewTab(input.to_url);
				}
				await page.waitForLoadState(input.wait_until);
				const msg = `🔗  Navigated to ${input.to_url}`;
				content.push({ type: 'text', text: msg });
				break;
			}
			default: {
				throw new Error(`Unknown navigate_or_back action: ${input.action}`);
			}
		}

		return content;
	},
});

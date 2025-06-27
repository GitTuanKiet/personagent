import { z } from 'zod';
import { DynamicStructuredAction, type ActionResult } from '../base.js';

export const tabManagerAction = new DynamicStructuredAction({
	name: 'tab_manager',
	description: 'Manage tabs for the browser session',
	schema: z
		.object({
			action: z.enum(['open', 'close', 'switch']).describe('The action to perform'),
			url: z.string().optional().describe('The URL to navigate to. Required if action is open'),
			tab_id: z
				.number()
				.optional()
				.describe('The tab ID to switch to. Required if action is switch, close'),
		})
		.superRefine((val, ctx) => {
			if (val.action === 'open' && !val.url) {
				ctx.addIssue({
					path: ['url'],
					code: z.ZodIssueCode.custom,
					message: 'url is required when action is "open"',
				});
			}
			if ((val.action === 'switch' || val.action === 'close') && val.tab_id === undefined) {
				ctx.addIssue({
					path: ['tab_id'],
					code: z.ZodIssueCode.custom,
					message: 'tab_id is required when action is "switch" or "close"',
				});
			}
		}),
	func: async (input, _runManager, config) => {
		const instance = await DynamicStructuredAction.getBrowserSession(config);
		const content: ActionResult = [];

		switch (input.action) {
			case 'open': {
				if (!input.url) throw new Error('Missing url for open action');
				await instance.createNewTab(input.url);
				content.push({ type: 'text', text: `🔗 Opened new tab with ${input.url}` });
				break;
			}
			case 'close': {
				if (typeof input.tab_id !== 'number') throw new Error('Missing tab_id for close action');
				await instance.switchToTab(input.tab_id);
				const page = await instance.getCurrentPage();
				const url = page.url();
				await page.close();
				content.push({ type: 'text', text: `❌ Closed tab #${input.tab_id} with url ${url}` });
				break;
			}
			case 'switch': {
				if (typeof input.tab_id !== 'number') throw new Error('Missing tab_id for switch action');
				await instance.switchToTab(input.tab_id);
				content.push({ type: 'text', text: `🔄 Switched to tab ${input.tab_id}` });
				break;
			}
			default:
				throw new Error(`Unknown tab_manager action: ${input.action}`);
		}

		return content;
	},
});

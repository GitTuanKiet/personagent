import { z } from 'zod';
import { DynamicStructuredAction, getBrowserInstance } from '../base';

export const openTabAction = new DynamicStructuredAction({
	name: 'open_tab',
	description: 'Open a specific url in new tab',
	schema: z.object({
		url: z.string().describe('URL to open in the new tab.'),
	}),
	func: async (input) => {
		const instance = getBrowserInstance();
		await instance.createNewTab(input.url);
		const msg = `🔗  Opened new tab with ${input.url}`;
		console.info(msg);
		return msg;
	},
});

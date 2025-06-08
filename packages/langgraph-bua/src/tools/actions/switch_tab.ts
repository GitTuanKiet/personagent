import { z } from 'zod';
import { DynamicStructuredAction, getBrowserInstance } from '../base';

export const switchTabAction = new DynamicStructuredAction({
	name: 'switch_tab',
	description: 'Switch to a tab.',
	schema: z.object({
		page_id: z.number().describe('ID of the tab to switch to.'),
	}),
	func: async (input) => {
		const instance = getBrowserInstance();
		await instance.switchToTab(input.page_id);
		const msg = `🔄  Switched to tab ${input.page_id}`;
		console.info(msg);
		return msg;
	},
});

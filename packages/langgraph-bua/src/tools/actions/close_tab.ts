import { z } from 'zod';
import { DynamicStructuredAction, getBrowserInstance } from '../base';

export const closeTabAction = new DynamicStructuredAction({
	name: 'close_tab',
	description: 'Close an existing tab',
	schema: z.object({
		page_id: z.number().describe('ID of the tab to close'),
	}),
	func: async (input) => {
		const instance = getBrowserInstance();
		await instance.switchToTab(input.page_id);
		const page = await instance.getCurrentPage();
		const url = page.url();
		await page.close();
		const msg = `❌  Closed tab #${input.page_id} with url ${url}`;
		console.info(msg);
		return msg;
	},
});

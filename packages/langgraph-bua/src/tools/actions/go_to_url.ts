import { z } from 'zod';
import { DynamicStructuredAction, getBrowserInstance } from '../base';

export const goToUrlAction = new DynamicStructuredAction({
	name: 'go_to_url',
	description: 'Navigate to URL in the current tab',
	schema: z.object({
		url: z.string().describe('The URL to navigate to'),
	}),
	func: async (input) => {
		const instance = getBrowserInstance();
		let page = await instance.getCurrentPage();
		if (page) {
			await page.goto(input.url);
			await page.waitForLoadState();
		} else {
			page = await instance.createNewTab(input.url);
		}
		const msg = `🔗  Navigated to ${input.url}`;
		console.info(msg);
		return msg;
	},
});

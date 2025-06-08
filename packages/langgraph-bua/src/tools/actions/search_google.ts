import { z } from 'zod';
import { DynamicStructuredAction, getBrowserInstance } from '../base';

export const searchGoogleAction = new DynamicStructuredAction({
	name: 'search_google',
	description:
		'Search the query in Google, the query should be a search query like humans search in Google, concrete and not vague or super long.',
	schema: z.object({
		query: z.string().describe('The search query'),
	}),
	func: async (input) => {
		const instance = getBrowserInstance();
		let page = await instance.getCurrentPage();
		const searchUrl = `https://www.bing.com/search?q=${input.query}`;
		if (page) {
			await page.goto(searchUrl);
			await page.waitForLoadState();
		} else {
			page = await instance.createNewTab(searchUrl);
		}
		const msg = `🔍  Searched for "${input.query}" in Google`;
		console.info(msg);
		return msg;
	},
});

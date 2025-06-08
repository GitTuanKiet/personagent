import { z } from 'zod';
import { DynamicStructuredAction, getBrowserInstance } from '../base';

export const scrollDownAction = new DynamicStructuredAction({
	name: 'scroll_down',
	description: 'Scroll down the page by pixel amount - if none is given, scroll one page',
	schema: z.object({
		amount: z
			.number()
			.nullable()
			.optional()
			.describe('Unit: pixel, if none is given, scroll one page'),
	}),
	func: async (input) => {
		const instance = getBrowserInstance();
		const page = await instance.getCurrentPage();
		const dy = input.amount ?? (await page.evaluate(() => window.innerHeight));
		try {
			await instance.scrollContainer(dy);
		} catch (e) {
			await page.evaluate((y) => window.scrollBy(0, y), dy);
			console.debug(`Smart scroll failed; used window.scrollBy fallback: ${e}`);
		}
		const amountStr = input.amount !== undefined ? `${input.amount} pixels` : 'one page';
		const msg = `🔍 Scrolled down the page by ${amountStr}`;
		console.info(msg);
		return msg;
	},
});

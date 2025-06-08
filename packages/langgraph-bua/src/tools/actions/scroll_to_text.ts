import { z } from 'zod';
import { DynamicStructuredAction, getBrowserInstance } from '../base';

export const scrollToTextAction = new DynamicStructuredAction({
	name: 'scroll_to_text',
	description: 'If you dont find something which you want to interact with, scroll to it',
	schema: z.object({
		text: z.string().describe('Text to scroll to'),
	}),
	func: async (input) => {
		const instance = getBrowserInstance();
		const page = await instance.getCurrentPage();
		const text = input.text;
		const locators = [
			page.getByText(text, { exact: false }),
			page.locator(`text=${text}`),
			page.locator(`//*[contains(text(), '${text}')]`),
		];
		for (const locator of locators) {
			try {
				if ((await locator.count()) === 0) continue;
				const element = await locator.first();
				const isVisible = await element.isVisible();
				const bbox = await element.boundingBox();
				if (isVisible && bbox && bbox.width > 0 && bbox.height > 0) {
					await element.scrollIntoViewIfNeeded();
					await new Promise((res) => setTimeout(res, 500));
					const msg = `🔍  Scrolled to text: ${text}`;
					console.info(msg);
					return msg;
				}
			} catch (e) {
				console.debug(`Locator attempt failed: ${String(e)}`);
				continue;
			}
		}
		const msg = `Text '${text}' not found or not visible on page.`;
		console.info(msg);
		return msg;
	},
});

import { z } from 'zod';
import { DynamicStructuredAction, type ActionResult } from '../base.js';

export const scrollAction = new DynamicStructuredAction({
	name: 'scroll',
	description: 'Scroll the page',
	schema: z
		.object({
			direction: z.enum(['up', 'down', 'to_text']).describe('The direction to scroll'),
			to_text: z
				.string()
				.optional()
				.describe('The text to scroll to. Required if direction is to_text'),
			pixel: z
				.number()
				.optional()
				.describe('The pixel amount to scroll. If none is given, scroll one page'),
		})
		.superRefine((val, ctx) => {
			if (val.direction === 'to_text' && !val.to_text) {
				ctx.addIssue({
					path: ['to_text'],
					code: z.ZodIssueCode.custom,
					message: 'to_text is required when direction is "to_text"',
				});
			}
		}),
	func: async (input, _runManager, config) => {
		const instance = await DynamicStructuredAction.getBrowserSession(config);
		const content: ActionResult = [];

		const page = await instance.getCurrentPage();

		switch (input.direction) {
			case 'down': {
				const dy = input.pixel ?? (await page.evaluate(() => window.innerHeight));
				try {
					await instance.scrollContainer(dy);
				} catch (e) {
					await page.evaluate((y) => window.scrollBy(0, y), dy);
					console.debug(`Smart scroll failed; used window.scrollBy fallback: ${e}`);
				}
				const amountStr = input.pixel !== undefined ? `${input.pixel} pixels` : 'one page';
				const msg = `🔍 Scrolled down the page by ${amountStr}`;
				content.push({ type: 'text', text: msg });
				break;
			}
			case 'up': {
				const dy = -(input.pixel ?? (await page.evaluate(() => window.innerHeight)));
				try {
					await instance.scrollContainer(dy);
				} catch (e) {
					await page.evaluate((y) => window.scrollBy(0, y), dy);
					console.debug(`Smart scroll failed; used window.scrollBy fallback: ${e}`);
				}
				const amountStr = input.pixel !== undefined ? `${input.pixel} pixels` : 'one page';
				const msg = `🔍 Scrolled up the page by ${amountStr}`;
				content.push({ type: 'text', text: msg });
				break;
			}
			case 'to_text': {
				const text = input.to_text;
				if (!text) throw new Error('Missing to_text for scroll direction to_text');
				const locators = [
					page.getByText(text, { exact: false }),
					page.locator(`text=${text}`),
					page.locator(`//*[contains(text(), '${text}')]`),
				];
				let found = false;
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
							content.push({ type: 'text', text: msg });
							found = true;
							break;
						}
					} catch (e) {
						console.debug(`Locator attempt failed: ${String(e)}`);
						continue;
					}
				}
				if (!found) {
					const msg = `🔍  Text '${text}' not found or not visible on page.`;
					content.push({ type: 'text', text: msg });
				}
				break;
			}
			default: {
				throw new Error(`Unknown scroll direction: ${input.direction}`);
			}
		}

		return content;
	},
});

import { z } from 'zod';
import { DynamicStructuredAction } from '../base';

export const sendKeysAction = new DynamicStructuredAction({
	name: 'send_keys',
	description: 'Send keys to the page',
	schema: z.object({
		keys: z.string().describe('The keys to send to the page'),
	}),
	func: async (input, _runManager, config) => {
		const instance = await DynamicStructuredAction.getBrowserSession(config);
		const page = await instance.getCurrentPage();
		try {
			await page.keyboard.press(input.keys);
		} catch (e) {
			const err = e as Error;
			if (typeof err.message === 'string' && err.message.includes('Unknown key')) {
				for (const key of input.keys) {
					try {
						await page.keyboard.press(key);
					} catch (err) {
						console.debug(`Error sending key ${key}: ${String(err)}`);
						throw err;
					}
				}
			} else {
				throw e;
			}
		}
		const msg = `⌨️  Sent keys: ${input.keys}`;
		return [{ type: 'text', text: msg }];
	},
});

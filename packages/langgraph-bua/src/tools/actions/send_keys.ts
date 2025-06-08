import { z } from 'zod';
import { DynamicStructuredAction, getBrowserInstance } from '../base';

export const sendKeysAction = new DynamicStructuredAction({
	name: 'send_keys',
	description:
		'Send strings of special keys like Escape,Backspace, Insert, PageDown, Delete, Enter, Shortcuts such as `Control+o`, `Control+Shift+T` are supported as well. This gets used in keyboard.press',
	schema: z.object({
		keys: z.string().describe('Keys to send.'),
	}),
	func: async (input) => {
		const instance = getBrowserInstance();
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
		console.info(msg);
		return msg;
	},
});

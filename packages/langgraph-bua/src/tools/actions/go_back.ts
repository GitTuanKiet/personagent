import { z } from 'zod';
import { DynamicStructuredAction, getBrowserInstance } from '../base';

export const goBackAction = new DynamicStructuredAction({
	name: 'go_back',
	description: 'Navigate back to the previous page',
	schema: z.object({}),
	func: async () => {
		const instance = getBrowserInstance();
		await instance.goBack();
		const msg = '🔙  Navigated back';
		console.info(msg);
		return msg;
	},
});

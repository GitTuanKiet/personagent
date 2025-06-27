import { z } from 'zod';
import { DynamicStructuredAction } from '../base.js';

export const waitAction = new DynamicStructuredAction({
	name: 'wait',
	description: 'Wait for a specified time',
	schema: z.object({
		seconds: z.number().default(3).describe('The number of seconds to wait, default is 3'),
	}),
	func: async (input) => {
		const ms = (input.seconds ?? 3) * 1000;
		await new Promise((resolve) => setTimeout(resolve, ms));
		const msg = `🕒  Waited for ${input.seconds ?? 3} seconds`;
		return [{ type: 'text', text: msg }];
	},
});

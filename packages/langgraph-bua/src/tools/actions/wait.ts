import { z } from 'zod';
import { DynamicStructuredAction } from '../base';
import { sleep } from '../../browser/utils';

export const waitAction = new DynamicStructuredAction({
	name: 'wait',
	description: 'Wait for a specified time',
	schema: z.object({
		seconds: z.number().default(3).describe('Number of seconds to wait, default is 3'),
	}),
	func: async (input) => {
		await sleep(input.seconds * 1000);
		const msg = `🕒  Waited for ${input.seconds} seconds`;
		console.info(msg);
		return msg;
	},
});

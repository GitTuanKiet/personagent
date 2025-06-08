import { z } from 'zod';
import { DynamicStructuredAction } from '../base';

export const doneAction = new DynamicStructuredAction({
	name: 'done',
	description:
		'Complete task - use this tool when you have completed the task or failed to complete the task',
	schema: z.object({
		text: z.string().describe('Result text of the operation'),
		ok: z.boolean(),
	}),
	func: async (input) => {
		const msg = input.ok ? `✅  ${input.text}` : `❌  ${input.text}`;
		console.info(msg);
		return msg;
	},
});

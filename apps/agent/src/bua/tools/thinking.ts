import { z } from 'zod';
import { DynamicStructuredAction } from './base.js';

export const thinkingAction = new DynamicStructuredAction({
	name: 'thinking',
	description: `A detailed tool for storing your thoughts and reasoning.`,
	schema: z.object({
		thoughts: z
			.string()
			.describe(
				'Your internal reasoning or analysis to understand or resolve the current difficulty.',
			),
	}),
	func: async (input) => {
		return [{ type: 'text', text: input.thoughts }];
	},
});

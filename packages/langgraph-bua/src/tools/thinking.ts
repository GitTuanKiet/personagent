import { z } from 'zod';
import { DynamicStructuredAction } from './base';

export const thinkingAction = new DynamicStructuredAction({
	name: 'thinking',
	description: `A reflective tool used when the agent encounters uncertainty, repeating actions, or needs to reassess the strategy before proceeding.`,
	schema: z.object({
		thoughts: z
			.string()
			.describe(
				'Your internal reasoning or analysis to understand or resolve the current difficulty.',
			),
	}),
	func: async (input) => {
		return input.thoughts;
	},
});

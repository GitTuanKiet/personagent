import { z } from 'zod';
import { DynamicStructuredAction } from '../base.js';

export const inputTextAction = new DynamicStructuredAction({
	name: 'input_text',
	description: 'Input text into an element',
	schema: z.object({
		index: z.number().describe('The index of the element to input text into'),
		text: z.string().describe('The text to input into the element'),
	}),
	func: async (input, _runManager, config) => {
		const instance = await DynamicStructuredAction.getBrowserSession(config);

		if (!(await instance.getSelectorMap()).has(input.index)) {
			throw new Error(
				`Element index ${input.index} does not exist - retry or use alternative actions`,
			);
		}
		const elementNode = await instance.getDomElementByIndex(input.index);
		if (!elementNode) {
			throw new Error(
				`Element index ${input.index} does not exist - retry or use alternative actions`,
			);
		}
		await instance.inputTextElementNode(elementNode, input.text);
		const msg = `⌨️  Input ${input.text} into index ${input.index}`;
		return [{ type: 'text', text: msg }];
	},
});

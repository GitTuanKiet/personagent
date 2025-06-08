import { z } from 'zod';
import { DynamicStructuredAction, getBrowserInstance, BrowserCallToolError } from '../base';

export const inputTextAction = new DynamicStructuredAction({
	name: 'input_text',
	description: 'Input text into a input interactive element',
	schema: z.object({
		index: z.number().describe('Index of the element'),
		text: z.string().describe('Text to input'),
		xpath: z.string().nullable().optional().describe('Optional XPath of the element'),
	}),
	func: async (input) => {
		const instance = getBrowserInstance();
		if (!(await instance.getSelectorMap()).has(input.index)) {
			throw new BrowserCallToolError(
				`Element index ${input.index} does not exist - retry or use alternative actions`,
			);
		}
		const elementNode = await instance.getDomElementByIndex(input.index);
		if (!elementNode) {
			throw new BrowserCallToolError(
				`Element index ${input.index} does not exist - retry or use alternative actions`,
			);
		}
		await instance.inputTextElementNode(elementNode, input.text);
		// TODO: Add sensitive data manager
		// if (this.sensitiveDataManager.isSensitiveText(input.text)) {
		//     msg = `⌨️  Input sensitive data into index ${input.index}`;
		// } else {
		//     msg = `⌨️  Input ${input.text} into index ${input.index}`;
		// }
		const msg = `⌨️  Input ${input.text} into index ${input.index}`;
		console.info(msg);
		return msg;
	},
});

import { z } from 'zod';
import { DynamicStructuredAction } from '../base.js';

export const clickElementByIndexAction = new DynamicStructuredAction({
	name: 'click_element_by_index',
	description: 'Click an element by index',
	schema: z.object({
		index: z.number().describe('The index of the element to click'),
	}),
	func: async (input, _runManager, config) => {
		const instance = await DynamicStructuredAction.getBrowserSession(config);

		if (!(await instance.getSelectorMap()).has(input.index)) {
			throw new Error(
				`Element with index ${input.index} does not exist - retry or use alternative actions`,
			);
		}
		const elementNode = await instance.getDomElementByIndex(input.index);
		const initialPages = instance.tabs.length;
		if (!elementNode) {
			throw new Error(
				`Element with index ${input.index} does not exist - retry or use alternative actions`,
			);
		}
		if (await instance.findFileUploadElementByIndex(input.index)) {
			const msg = `Index ${input.index} - has an element which opens file upload dialog. To upload files please use a specific function to upload files `;
			return [{ type: 'text', text: msg }];
		}
		let msg = '';

		const downloadPath = await instance.clickElementNode(elementNode);
		if (downloadPath) {
			msg = `💾  Downloaded file to ${downloadPath}`;
		} else {
			msg = `🖱️  Clicked button with index ${input.index}: ${elementNode.getAllTextTillNextClickableElement(2)}`;
		}
		if (instance.tabs.length > initialPages) {
			const newTabMsg = 'New tab opened - switching to it';
			msg += ` - ${newTabMsg}`;
			await instance.switchToTab(instance.tabs.length - 1);
		}
		return [{ type: 'text', text: msg }];
	},
});

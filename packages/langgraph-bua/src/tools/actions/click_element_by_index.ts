import { z } from 'zod';
import { DynamicStructuredAction, getBrowserInstance, BrowserCallToolError } from '../base';

export const clickElementByIndexAction = new DynamicStructuredAction({
	name: 'click_element_by_index',
	description: 'Click an element by index',
	schema: z.object({
		index: z.number().describe('Index of the element to click'),
		xpath: z.string().nullable().optional().describe('Optional XPath of the element'),
	}),
	func: async (input) => {
		const instance = getBrowserInstance();
		if (!(await instance.getSelectorMap()).has(input.index)) {
			throw new BrowserCallToolError(
				`Element with index ${input.index} does not exist - retry or use alternative actions`,
			);
		}
		const elementNode = await instance.getDomElementByIndex(input.index);
		const initialPages = instance.tabs.length;
		if (!elementNode) {
			throw new BrowserCallToolError(
				`Element with index ${input.index} does not exist - retry or use alternative actions`,
			);
		}
		if (await instance.findFileUploadElementByIndex(input.index)) {
			const msg = `Index ${input.index} - has an element which opens file upload dialog. To upload files please use a specific function to upload files `;
			console.info(msg);
			return msg;
		}
		let msg = '';
		try {
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
			console.info(msg);
			return msg;
		} catch (e) {
			console.error(e);
			return e instanceof Error ? e.message : String(e);
		}
	},
});

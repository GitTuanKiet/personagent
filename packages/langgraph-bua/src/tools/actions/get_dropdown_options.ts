import { z } from 'zod';
import { DynamicStructuredAction, getBrowserInstance } from '../base';

export const getDropdownOptionsAction = new DynamicStructuredAction({
	name: 'get_dropdown_options',
	description: 'Get all options from a native dropdown',
	schema: z.object({
		index: z.number().describe('Index of the dropdown element.'),
	}),
	func: async (input) => {
		const instance = getBrowserInstance();
		const page = await instance.getCurrentPage();
		const selectorMap = await instance.getSelectorMap();
		const domElement = selectorMap.get(input.index);
		if (!domElement) {
			const msg = `Dropdown element with index ${input.index} not found in selector map.`;
			console.error(msg);
			return msg;
		}
		try {
			const allOptions: string[] = [];
			let frameIndex = 0;
			for (const frame of page.frames()) {
				try {
					const options = (await frame.evaluate(
						`(xpath) => {
                        const select = document.evaluate(xpath, document, null,
                            XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        if (!select) return null;
                        return {
                            options: Array.from(select.options).map(opt => ({
                                text: opt.text,
                                value: opt.value,
                                index: opt.index
                            })),
                            id: select.id,
                            name: select.name
                        };
                    }`,
						domElement.xpath,
					)) as {
						options: { text: string; value: string; index: number }[];
						id: string;
						name: string;
					};
					if (options) {
						const formattedOptions: string[] = [];
						for (const option of options.options as Array<unknown>) {
							const o = option as { text: string; value: string; index: number };
							const encodedText = JSON.stringify(o.text);
							formattedOptions.push(`${o.index}: text=${encodedText}`);
						}
						allOptions.push(...formattedOptions);
					}
				} catch (frameE) {
					continue;
				}
				frameIndex += 1;
			}
			let msg;
			if (allOptions.length > 0) {
				msg = allOptions.join('\n');
				msg += '\nUse the exact text string in select_dropdown_option';
				console.info(msg);
				return msg;
			} else {
				msg = 'No options found in any frame for dropdown';
				console.info(msg);
				return msg;
			}
		} catch (e) {
			const msg = `Error getting options: ${String(e)}`;
			console.info(msg);
			return msg;
		}
	},
});

import { z } from 'zod';
import { DynamicStructuredAction, getBrowserInstance } from '../base';

export const selectDropdownOptionAction = new DynamicStructuredAction({
	name: 'select_dropdown_option',
	description:
		'Select dropdown option for interactive element index by the text of the option you want to select',
	schema: z.object({
		index: z.number().describe('Index of the dropdown element.'),
		text: z.string().describe('Text of the option to select.'),
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
		if (domElement.tagName !== 'select') {
			const msg = `Cannot select option: Element with index ${input.index} is a ${domElement.tagName}, not a select`;
			return msg;
		}
		const xpath = '//' + domElement.xpath;
		try {
			let frameIndex = 0;
			for (const frame of page.frames()) {
				try {
					const findDropdownJs = `(xpath) => {
                        try {
                            const select = document.evaluate(xpath, document, null,
                                XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                            if (!select) return null;
                            if (select.tagName.toLowerCase() !== 'select') {
                                return {
                                    error: 'Found element but it\'s a ' + select.tagName + ', not a SELECT',
                                    found: false
                                };
                            }
                            return {
                                id: select.id,
                                name: select.name,
                                found: true,
                                tagName: select.tagName,
                                optionCount: select.options.length,
                                currentValue: select.value,
                                availableOptions: Array.from(select.options).map(o => o.text.trim())
                            };
                        } catch (e) {
                            return {error: e.toString(), found: false};
                        }
                    }`;
					const dropdownInfo = (await frame.evaluate(findDropdownJs, domElement.xpath)) as {
						error: string;
						found: boolean;
					} | null;
					if (dropdownInfo) {
						if (!dropdownInfo.found) {
							continue;
						}
						const selectedOptionValues = await frame
							.locator(xpath)
							.nth(0)
							.selectOption({ label: input.text }, { timeout: 1000 });
						const msg = `selected option ${input.text} with value ${JSON.stringify(selectedOptionValues)} `;
						console.info(msg + ` in frame ${frameIndex} `);
						return msg;
					}
				} catch (frameE) {
					continue;
				}
				frameIndex += 1;
			}
			const msg = `Could not select option '${input.text}' in any frame`;
			console.info(msg);
			return msg;
		} catch (e) {
			const msg = `Selection failed: ${String(e)} `;
			console.error(msg);
			return msg;
		}
	},
});

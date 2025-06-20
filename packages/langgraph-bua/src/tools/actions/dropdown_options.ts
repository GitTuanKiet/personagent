import { z } from 'zod';
import { DynamicStructuredAction, type ActionResult } from '../base';

export const dropdownOptionsAction = new DynamicStructuredAction({
	name: 'dropdown_options',
	description: 'Get dropdown options',
	schema: z
		.object({
			action: z.enum(['get_options', 'select_option']).describe('The action to perform'),
			index: z.number().describe('The index of the dropdown to get options from.'),
			text: z
				.string()
				.optional()
				.describe('The text of the option to select. Required if action is select_option'),
		})
		.superRefine((val, ctx) => {
			if (val.action === 'select_option' && !val.text) {
				ctx.addIssue({
					path: ['text'],
					code: z.ZodIssueCode.custom,
					message: 'text is required when action is "select_option"',
				});
			}
		}),
	func: async (input, _runManager, config) => {
		const instance = await DynamicStructuredAction.getBrowserSession(config);

		const page = await instance.getCurrentPage();
		const selectorMap = await instance.getSelectorMap();

		const content: ActionResult = [];
		switch (input.action) {
			case 'get_options': {
				const domElement = selectorMap.get(input.index);
				if (!domElement) {
					const msg = `Dropdown element with index ${input.index} not found in selector map.`;
					console.error(msg);
					content.push({ type: 'text', text: msg });
					break;
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
						content.push({ type: 'text', text: msg });
					} else {
						msg = 'No options found in any frame for dropdown';
						console.info(msg);
						content.push({ type: 'text', text: msg });
					}
				} catch (e) {
					const msg = `❌ Error getting options: ${String(e)}`;
					throw new Error(msg);
				}
				break;
			}
			case 'select_option': {
				const domElement = selectorMap.get(input.index);
				if (!domElement) {
					const msg = `Dropdown element with index ${input.index} not found in selector map.`;
					console.error(msg);
					content.push({ type: 'text', text: msg });
					break;
				}
				if (domElement.tagName !== 'select') {
					const msg = `Cannot select option: Element with index ${input.index} is a ${domElement.tagName}, not a select`;
					content.push({ type: 'text', text: msg });
					break;
				}
				const xpath = '//' + domElement.xpath;
				try {
					let frameIndex = 0;
					let selected = false;
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
								content.push({ type: 'text', text: msg });
								selected = true;
								break;
							}
						} catch (frameE) {
							continue;
						}
						frameIndex += 1;
					}
					if (!selected) {
						const msg = `Could not select option '${input.text}' in any frame`;
						console.info(msg);
						content.push({ type: 'text', text: msg });
					}
				} catch (e) {
					const msg = `❌ Selection failed: ${String(e)} `;
					throw new Error(msg);
				}

				break;
			}
		}

		return content;
	},
});

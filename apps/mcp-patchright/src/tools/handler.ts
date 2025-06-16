import { TextContent, ImageContent, AudioContent } from '@modelcontextprotocol/sdk/types.js';
import { BrowserSession } from '@pag/browser-manager';
import { browserContainer, BrowserManager } from '@pag/browser-manager';
import { ToolSchemas } from './schema.js';
import { getDragElements, getElementCoordinates, executeDragOperation } from './utils.js';
import type { z } from 'zod';

export type Content = (TextContent | ImageContent | AudioContent)[];
function parseArgs<T extends keyof typeof ToolSchemas>(
	name: T,
	args?: Record<string, unknown>,
): z.infer<(typeof ToolSchemas)[T]> {
	const schema = ToolSchemas[name];
	let parsedArgs: z.infer<typeof schema>;
	try {
		parsedArgs = schema.parse(args ?? {});
	} catch (error) {
		throw error;
	}

	return parsedArgs;
}

export async function handleTool(
	instance: BrowserSession,
	{ name, arguments: args }: { name: string; arguments?: Record<string, unknown> },
): Promise<{ content: Content; isError: boolean }> {
	const content: Content = [];

	switch (name) {
		case 'tab_manager': {
			const tabArgs = parseArgs(name, args);
			switch (tabArgs.action) {
				case 'open': {
					if (!tabArgs.url) throw new Error('Missing url for open action');
					await instance.createNewTab(tabArgs.url);
					content.push({ type: 'text', text: `🔗 Opened new tab with ${tabArgs.url}` });
					break;
				}
				case 'close': {
					if (typeof tabArgs.tab_id !== 'number')
						throw new Error('Missing tab_id for close action');
					await instance.switchToTab(tabArgs.tab_id);
					const page = await instance.getCurrentPage();
					const url = page.url();
					await page.close();
					content.push({ type: 'text', text: `❌ Closed tab #${tabArgs.tab_id} with url ${url}` });
					break;
				}
				case 'switch': {
					if (typeof tabArgs.tab_id !== 'number')
						throw new Error('Missing tab_id for switch action');
					await instance.switchToTab(tabArgs.tab_id);
					content.push({ type: 'text', text: `🔄 Switched to tab ${tabArgs.tab_id}` });
					break;
				}
				default:
					throw new Error(`Unknown tab_manager action: ${tabArgs.action}`);
			}
			break;
		}
		case 'wait': {
			const waitArgs = parseArgs(name, args);
			const ms = (waitArgs.seconds ?? 3) * 1000;
			await new Promise((resolve) => setTimeout(resolve, ms));
			const msg = `🕒  Waited for ${waitArgs.seconds ?? 3} seconds`;
			content.push({ type: 'text', text: msg });
			break;
		}
		case 'navigate_or_back': {
			const navArgs = parseArgs(name, args);
			switch (navArgs.action) {
				case 'go_back': {
					await instance.goBack();
					const msg = '🔙  Navigated back';
					content.push({ type: 'text', text: msg });
					break;
				}
				case 'to_url': {
					if (!navArgs.to_url) throw new Error('Missing to_url for navigate_or_back action');
					let page = await instance.getCurrentPage();
					if (page) {
						await page.goto(navArgs.to_url);
					} else {
						page = await instance.createNewTab(navArgs.to_url);
					}
					await page.waitForLoadState(navArgs.wait_until);
					const msg = `🔗  Navigated to ${navArgs.to_url}`;
					content.push({ type: 'text', text: msg });
					break;
				}
				default: {
					throw new Error(`Unknown navigate_or_back action: ${navArgs.action}`);
				}
			}
			break;
		}
		case 'get_content': {
			const contentArgs = parseArgs(name, args);
			const page = await instance.getCurrentPage();
			switch (contentArgs.content_type) {
				case 'page': {
					const turndownService = browserContainer
						.get(BrowserManager)
						.getTurndownService(contentArgs.include_links);
					let text = turndownService.turndown(await instance.getPageHtml());

					for (const iframe of page.frames()) {
						if (iframe.url() !== page.url() && !iframe.url().startsWith('data:')) {
							text += `\n\nIFRAME ${iframe.url()}:\n`;
							text += turndownService.turndown(await iframe.content());
						}
					}

					const msg = `📄  Extracted from page\n: ${text}\n`;
					content.push({ type: 'text', text: msg });
					break;
				}
				case 'ax_tree': {
					const node = await page.accessibility.snapshot({ interestingOnly: true });
					function flattenAxTree(
						node: Awaited<ReturnType<typeof page.accessibility.snapshot>>,
						lines: string[],
					) {
						if (!node) return;
						const role = node.role || '';
						const name = node.name || '';
						lines.push(`${role} ${name}`);
						if (node.children) {
							for (const child of node.children) {
								flattenAxTree(child, lines);
							}
						}
					}
					const lines: string[] = [];
					flattenAxTree(node, lines);
					const msg = lines.slice(0, contentArgs.number_of_elements).join('\n');
					content.push({ type: 'text', text: msg });
					break;
				}
				default: {
					throw new Error(`Unknown content_type: ${contentArgs.content_type}`);
				}
			}
			break;
		}
		case 'click_element_by_index': {
			const clickArgs = parseArgs(name, args);
			if (!(await instance.getSelectorMap()).has(clickArgs.index)) {
				throw new Error(
					`Element with index ${clickArgs.index} does not exist - retry or use alternative actions`,
				);
			}
			const elementNode = await instance.getDomElementByIndex(clickArgs.index);
			const initialPages = instance.tabs.length;
			if (!elementNode) {
				throw new Error(
					`Element with index ${clickArgs.index} does not exist - retry or use alternative actions`,
				);
			}
			if (await instance.findFileUploadElementByIndex(clickArgs.index)) {
				const msg = `Index ${clickArgs.index} - has an element which opens file upload dialog. To upload files please use a specific function to upload files `;
				content.push({ type: 'text', text: msg });
				break;
			}
			let msg = '';

			const downloadPath = await instance.clickElementNode(elementNode);
			if (downloadPath) {
				msg = `💾  Downloaded file to ${downloadPath}`;
			} else {
				msg = `🖱️  Clicked button with index ${clickArgs.index}: ${elementNode.getAllTextTillNextClickableElement(2)}`;
			}
			if (instance.tabs.length > initialPages) {
				const newTabMsg = 'New tab opened - switching to it';
				msg += ` - ${newTabMsg}`;
				await instance.switchToTab(instance.tabs.length - 1);
			}
			content.push({ type: 'text', text: msg });

			break;
		}
		case 'input_text': {
			const inputArgs = parseArgs(name, args);
			if (!(await instance.getSelectorMap()).has(inputArgs.index)) {
				throw new Error(
					`Element index ${inputArgs.index} does not exist - retry or use alternative actions`,
				);
			}
			const elementNode = await instance.getDomElementByIndex(inputArgs.index);
			if (!elementNode) {
				throw new Error(
					`Element index ${inputArgs.index} does not exist - retry or use alternative actions`,
				);
			}
			await instance.inputTextElementNode(elementNode, inputArgs.text);
			// TODO: Add sensitive data manager
			// if (this.sensitiveDataManager.isSensitiveText(input.text)) {
			//     msg = `⌨️  Input sensitive data into index ${input.index}`;
			// } else {
			//     msg = `⌨️  Input ${input.text} into index ${input.index}`;
			// }
			const msg = `⌨️  Input ${inputArgs.text} into index ${inputArgs.index}`;
			content.push({ type: 'text', text: msg });
			break;
		}
		case 'scroll': {
			const scrollArgs = parseArgs(name, args);
			const page = await instance.getCurrentPage();
			switch (scrollArgs.direction) {
				case 'down': {
					const dy = scrollArgs.pixel ?? (await page.evaluate(() => window.innerHeight));
					try {
						await instance.scrollContainer(dy);
					} catch (e) {
						await page.evaluate((y) => window.scrollBy(0, y), dy);
						console.debug(`Smart scroll failed; used window.scrollBy fallback: ${e}`);
					}
					const amountStr =
						scrollArgs.pixel !== undefined ? `${scrollArgs.pixel} pixels` : 'one page';
					const msg = `🔍 Scrolled down the page by ${amountStr}`;
					content.push({ type: 'text', text: msg });
					break;
				}
				case 'up': {
					const dy = -(scrollArgs.pixel ?? (await page.evaluate(() => window.innerHeight)));
					try {
						await instance.scrollContainer(dy);
					} catch (e) {
						await page.evaluate((y) => window.scrollBy(0, y), dy);
						console.debug(`Smart scroll failed; used window.scrollBy fallback: ${e}`);
					}
					const amountStr =
						scrollArgs.pixel !== undefined ? `${scrollArgs.pixel} pixels` : 'one page';
					const msg = `🔍 Scrolled up the page by ${amountStr}`;
					content.push({ type: 'text', text: msg });
					break;
				}
				case 'to_text': {
					const text = scrollArgs.to_text;
					if (!text) throw new Error('Missing to_text for scroll direction to_text');
					const locators = [
						page.getByText(text, { exact: false }),
						page.locator(`text=${text}`),
						page.locator(`//*[contains(text(), '${text}')]`),
					];
					let found = false;
					for (const locator of locators) {
						try {
							if ((await locator.count()) === 0) continue;
							const element = await locator.first();
							const isVisible = await element.isVisible();
							const bbox = await element.boundingBox();
							if (isVisible && bbox && bbox.width > 0 && bbox.height > 0) {
								await element.scrollIntoViewIfNeeded();
								await new Promise((res) => setTimeout(res, 500));
								const msg = `🔍  Scrolled to text: ${text}`;
								content.push({ type: 'text', text: msg });
								found = true;
								break;
							}
						} catch (e) {
							console.debug(`Locator attempt failed: ${String(e)}`);
							continue;
						}
					}
					if (!found) {
						const msg = `🔍  Text '${text}' not found or not visible on page.`;
						content.push({ type: 'text', text: msg });
					}
					break;
				}
				default: {
					throw new Error(`Unknown scroll direction: ${scrollArgs.direction}`);
				}
			}
			break;
		}
		case 'execute_javascript': {
			const jsArgs = parseArgs(name, args);
			await instance.executeJavascript(jsArgs.script);
			const msg = `💻  Executed JavaScript: ${jsArgs.script}`;
			content.push({ type: 'text', text: msg });
			break;
		}
		case 'send_keys': {
			const keyArgs = parseArgs(name, args);
			const page = await instance.getCurrentPage();
			try {
				await page.keyboard.press(keyArgs.keys);
			} catch (e) {
				const err = e as Error;
				if (typeof err.message === 'string' && err.message.includes('Unknown key')) {
					for (const key of keyArgs.keys) {
						try {
							await page.keyboard.press(key);
						} catch (err) {
							console.debug(`Error sending key ${key}: ${String(err)}`);
							throw err;
						}
					}
				} else {
					throw e;
				}
			}
			const msg = `⌨️  Sent keys: ${keyArgs.keys}`;
			content.push({ type: 'text', text: msg });
			break;
		}
		case 'dropdown_options': {
			const dropdownArgs = parseArgs(name, args);
			switch (dropdownArgs.action) {
				case 'get_options': {
					const page = await instance.getCurrentPage();
					const selectorMap = await instance.getSelectorMap();
					const domElement = selectorMap.get(dropdownArgs.index);
					if (!domElement) {
						const msg = `Dropdown element with index ${dropdownArgs.index} not found in selector map.`;
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
					const page = await instance.getCurrentPage();
					const selectorMap = await instance.getSelectorMap();
					const domElement = selectorMap.get(dropdownArgs.index);
					if (!domElement) {
						const msg = `Dropdown element with index ${dropdownArgs.index} not found in selector map.`;
						console.error(msg);
						content.push({ type: 'text', text: msg });
						break;
					}
					if (domElement.tagName !== 'select') {
						const msg = `Cannot select option: Element with index ${dropdownArgs.index} is a ${domElement.tagName}, not a select`;
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
										.selectOption({ label: dropdownArgs.text }, { timeout: 1000 });
									const msg = `selected option ${dropdownArgs.text} with value ${JSON.stringify(selectedOptionValues)} `;
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
							const msg = `Could not select option '${dropdownArgs.text}' in any frame`;
							console.info(msg);
							content.push({ type: 'text', text: msg });
						}
					} catch (e) {
						const msg = `❌ Selection failed: ${String(e)} `;
						throw new Error(msg);
					}
					break;
				}
				default: {
					throw new Error(`Unknown dropdown_options action: ${dropdownArgs.action}`);
				}
			}
			break;
		}
		case 'drag_drop': {
			const dragDropArgs = parseArgs(name, args);
			const page = await instance.getCurrentPage();

			try {
				let sourceX = null,
					sourceY = null,
					targetX = null,
					targetY = null;
				const steps = Math.max(1, dragDropArgs.steps ?? 10);
				const delayMs = Math.max(0, dragDropArgs.delay_ms ?? 5);
				if (dragDropArgs.element_source && dragDropArgs.element_target) {
					const [sourceElement, targetElement] = await getDragElements(
						page,
						dragDropArgs.element_source,
						dragDropArgs.element_target,
					);
					if (!sourceElement || !targetElement) {
						const msg = `🖱️ Failed to find ${!sourceElement ? 'source' : 'target'} element`;
						content.push({ type: 'text', text: msg });
						break;
					}
					const [sourceCoords, targetCoords] = await getElementCoordinates(
						sourceElement,
						targetElement,
						dragDropArgs.element_source_offset,
						dragDropArgs.element_target_offset,
					);
					if (!sourceCoords || !targetCoords) {
						const msg = `🖱️ Failed to determine ${!sourceCoords ? 'source' : 'target'} coordinates`;
						content.push({ type: 'text', text: msg });
						break;
					}
					[sourceX, sourceY] = sourceCoords;
					[targetX, targetY] = targetCoords;
				} else if (
					[
						dragDropArgs.coord_source_x,
						dragDropArgs.coord_source_y,
						dragDropArgs.coord_target_x,
						dragDropArgs.coord_target_y,
					].every((coord) => coord !== undefined && coord !== null)
				) {
					sourceX = dragDropArgs.coord_source_x;
					sourceY = dragDropArgs.coord_source_y;
					targetX = dragDropArgs.coord_target_x;
					targetY = dragDropArgs.coord_target_y;
				} else {
					const msg = '🖱️ Must provide either source/target selectors or source/target coordinates';
					content.push({ type: 'text', text: msg });
					break;
				}
				if (
					[sourceX, sourceY, targetX, targetY].some(
						(coord) => coord === null || coord === undefined,
					)
				) {
					const msg = '🖱️ Failed to determine source or target coordinates';
					content.push({ type: 'text', text: msg });
					break;
				}
				const [success, message] = await executeDragOperation(
					page,
					sourceX!,
					sourceY!,
					targetX!,
					targetY!,
					steps,
					delayMs,
				);
				if (!success) {
					content.push({ type: 'text', text: message });
					break;
				}
				let msg;
				if (dragDropArgs.element_source && dragDropArgs.element_target) {
					msg = `🖱️ Dragged element '${dragDropArgs.element_source}' to '${dragDropArgs.element_target}'`;
				} else {
					msg = `🖱️ Dragged from (${sourceX}, ${sourceY}) to (${targetX}, ${targetY})`;
				}
				content.push({ type: 'text', text: msg });
				break;
			} catch (e) {
				const errorMsg = `🖱️ Failed to perform drag and drop: ${String(e)}`;
				throw new Error(errorMsg);
			}
		}
		default:
			throw new Error(`Unknown tool: ${name}`);
	}

	return { content, isError: false };
}

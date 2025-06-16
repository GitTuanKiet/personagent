import { singleton } from './di';
import { BrowserAction } from './action';
import type { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { PromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import TurndownService from 'turndown';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { repeat } from 'lodash';
import type { Page } from 'playwright';

export type ActionDescription = Pick<DynamicStructuredTool, 'name' | 'description' | 'schema'> & {
	pageMatcher?: (page: Page) => boolean;
};

const register = ({ name, description, schema, pageMatcher }: ActionDescription) =>
	function (
		_target: object,
		_propertyKey: string | symbol,
		propertyDescriptor: PropertyDescriptor,
	) {
		const originalMethod = propertyDescriptor.value as Function;

		propertyDescriptor.value = async function (this: ActionManager, ...args: any[]) {
			if (!this.descriptions.has(name)) {
				this.descriptions.set(name, { name, description, schema, pageMatcher });
			}

			if (schema instanceof z.ZodObject) {
				try {
					await schema.parse(args[0]);
				} catch (error) {
					console.error(error);
					throw new Error(
						`Invalid input for action ${name}: ${error instanceof Error ? error.message : String(error)}`,
					);
				}
			}

			return originalMethod.apply(this, args);
		};

		return propertyDescriptor;
	};

// zod schema
const clickElementByIndexSchema = z.object({
	index: z.number().describe('Index of the element to click'),
});

const closeTabSchema = z.object({
	page_id: z.number().describe('ID of the tab to close'),
});

const doneSchema = z.object({
	text: z.string().describe('Result text of the operation'),
	ok: z.boolean(),
});

const dragDropSchema = z.object({
	element_source: z
		.string()
		.nullable()
		.optional()
		.describe('CSS selector or XPath of the element to drag from'),
	element_target: z
		.string()
		.nullable()
		.optional()
		.describe('CSS selector or XPath of the element to drop onto'),
	element_source_offset: z
		.object({
			x: z.number(),
			y: z.number(),
		})
		.nullable()
		.optional()
		.describe(
			'Precise position within the source element to start drag (in pixels from top-left corner)',
		),
	element_target_offset: z
		.object({
			x: z.number(),
			y: z.number(),
		})
		.nullable()
		.optional()
		.describe(
			'Precise position within the target element to drop (in pixels from top-left corner)',
		),
	coord_source_x: z
		.number()
		.nullable()
		.optional()
		.describe('Absolute X coordinate on page to start drag from (in pixels)'),
	coord_source_y: z
		.number()
		.nullable()
		.optional()
		.describe('Absolute Y coordinate on page to start drag from (in pixels)'),
	coord_target_x: z
		.number()
		.nullable()
		.optional()
		.describe('Absolute X coordinate on page to drop at (in pixels)'),
	coord_target_y: z
		.number()
		.nullable()
		.optional()
		.describe('Absolute Y coordinate on page to drop at (in pixels)'),
	steps: z
		.number()
		.min(1)
		.max(20)
		.default(10)
		.nullable()
		.optional()
		.describe('Number of intermediate points for smoother movement (5-20 recommended)'),
	delay_ms: z
		.number()
		.min(0)
		.max(20)
		.default(5)
		.nullable()
		.optional()
		.describe('Delay in milliseconds between steps (0 for fastest, 10-20 for more natural)'),
});

const extractContentSchema = z.object({
	goal: z
		.string()
		.optional()
		.describe(
			'The goal to extract from the page. If not provided, the tool will extract the entire page content.',
		),
	include_links: z.boolean().describe('Whether to include links in the output'),
});

const getAxTreeSchema = z.object({
	number_of_elements: z.number().describe('Number of elements to retrieve.'),
});

const getDropdownOptionsSchema = z.object({
	index: z.number().describe('Index of the dropdown element.'),
});
const goBackSchema = z.object({});
const goToUrlSchema = z.object({
	url: z.string().describe('The URL to navigate to'),
});

const inputTextSchema = z.object({
	index: z.number().describe('Index of the element'),
	text: z.string().describe('Text to input'),
	xpath: z.string().nullable().optional().describe('Optional XPath of the element'),
});

const openTabSchema = z.object({
	url: z.string().describe('URL to open in the new tab.'),
});

const savePdfSchema = z.object({});

const scrollDownSchema = z.object({
	amount: z
		.number()
		.nullable()
		.optional()
		.describe('Unit: pixel, if none is given, scroll one page'),
});
const scrollUpSchema = z.object({
	amount: z
		.number()
		.nullable()
		.optional()
		.describe('Unit: pixel, if none is given, scroll one page'),
});
const scrollToTextSchema = z.object({
	text: z.string().describe('Text to scroll to'),
});

const searchGoogleSchema = z.object({
	query: z.string().describe('The search query'),
});

const selectDropdownOptionSchema = z.object({
	index: z.number().describe('Index of the dropdown element.'),
	text: z.string().describe('Text of the option to select.'),
});

const sendKeysSchema = z.object({
	keys: z.string().describe('Keys to send.'),
});
const switchTabSchema = z.object({
	page_id: z.number().describe('ID of the tab to switch to.'),
});
const waitSchema = z.object({
	seconds: z.number().default(3).describe('Number of seconds to wait, default is 3'),
});

@singleton()
export class ActionManager {
	descriptions: Map<string, ActionDescription>;

	constructor(private browserAction: BrowserAction) {
		this.descriptions = new Map();
	}

	// #region Actions
	@register({
		name: 'click_element_by_index',
		description: 'Click an element by index',
		schema: clickElementByIndexSchema,
	})
	async clickElementByIndex(input: z.infer<typeof clickElementByIndexSchema>) {
		if (!(await this.browserAction.getSelectorMap()).has(input.index)) {
			throw new Error(
				`Element with index ${input.index} does not exist - retry or use alternative actions`,
			);
		}
		const elementNode = await this.browserAction.getDomElementByIndex(input.index);
		const initialPages = this.browserAction.tabs.length;
		if (!elementNode) {
			throw new Error(
				`Element with index ${input.index} does not exist - retry or use alternative actions`,
			);
		}
		if (await this.browserAction.findFileUploadElementByIndex(input.index)) {
			const msg = `Index ${input.index} - has an element which opens file upload dialog. To upload files please use a specific function to upload files `;
			console.info(msg);
			return msg;
		}
		let msg = '';
		try {
			const downloadPath = await this.browserAction.clickElementNode(elementNode);
			if (downloadPath) {
				msg = `💾  Downloaded file to ${downloadPath}`;
			} else {
				msg = `🖱️  Clicked button with index ${input.index}: ${elementNode.getAllTextTillNextClickableElement(2)}`;
			}
			if (this.browserAction.tabs.length > initialPages) {
				const newTabMsg = 'New tab opened - switching to it';
				msg += ` - ${newTabMsg}`;
				await this.browserAction.switchToTab(this.browserAction.tabs.length - 1);
			}
			console.info(msg);
			return msg;
		} catch (e) {
			console.error(e);
			return e instanceof Error ? e.message : String(e);
		}
	}

	@register({
		name: 'close_tab',
		description: 'Close an existing tab',
		schema: closeTabSchema,
	})
	async closeTab(input: z.infer<typeof closeTabSchema>) {
		await this.browserAction.switchToTab(input.page_id);
		const page = await this.browserAction.getCurrentPage();
		const url = page.url();
		await page.close();
		const msg = `❌  Closed tab #${input.page_id} with url ${url}`;
		console.info(msg);
		return msg;
	}

	@register({
		name: 'done',
		description:
			'Complete task - use this tool when you have completed the task or failed to complete the task',
		schema: doneSchema,
	})
	async done(input: z.infer<typeof doneSchema>) {
		const msg = input.ok ? `✅  ${input.text}` : `❌  ${input.text}`;
		console.info(msg);
		return msg;
	}

	@register({
		name: 'drag_drop',
		description:
			'Drag and drop elements or between coordinates on the page - useful for canvas drawing, sortable lists, sliders, file uploads, and UI rearrangement',
		schema: dragDropSchema,
	})
	async dragDrop(input: z.infer<typeof dragDropSchema>) {
		const page = await this.browserAction.getCurrentPage();
		async function getDragElements(page: any, sourceSelector: string, targetSelector: string) {
			let sourceElement: any = null;
			let targetElement: any = null;
			try {
				const sourceLocator = page.locator(sourceSelector);
				const targetLocator = page.locator(targetSelector);
				if ((await sourceLocator.count()) > 0) {
					sourceElement = await sourceLocator.first().elementHandle();
				}
				if ((await targetLocator.count()) > 0) {
					targetElement = await targetLocator.first().elementHandle();
				}
			} catch (e) {}
			return [sourceElement, targetElement];
		}
		async function getElementCoordinates(
			sourceElement: any,
			targetElement: any,
			sourcePosition?: { x: number; y: number } | null,
			targetPosition?: { x: number; y: number } | null,
		) {
			let sourceCoords: [number, number] | null = null;
			let targetCoords: [number, number] | null = null;
			try {
				if (sourcePosition) {
					sourceCoords = [sourcePosition.x, sourcePosition.y];
				} else {
					const sourceBox = await sourceElement.boundingBox();
					if (sourceBox) {
						sourceCoords = [
							Math.round(sourceBox.x + sourceBox.width / 2),
							Math.round(sourceBox.y + sourceBox.height / 2),
						];
					}
				}
				if (targetPosition) {
					targetCoords = [targetPosition.x, targetPosition.y];
				} else {
					const targetBox = await targetElement.boundingBox();
					if (targetBox) {
						targetCoords = [
							Math.round(targetBox.x + targetBox.width / 2),
							Math.round(targetBox.y + targetBox.height / 2),
						];
					}
				}
			} catch (e) {}
			return [sourceCoords, targetCoords];
		}
		async function executeDragOperation(
			page: any,
			sourceX: number,
			sourceY: number,
			targetX: number,
			targetY: number,
			steps: number,
			delayMs: number,
		): Promise<[boolean, string]> {
			try {
				await page.mouse.move(sourceX, sourceY);
				await page.mouse.down();
				for (let i = 1; i <= steps; i++) {
					const ratio = i / steps;
					const intermediateX = Math.round(sourceX + (targetX - sourceX) * ratio);
					const intermediateY = Math.round(sourceY + (targetY - sourceY) * ratio);
					await page.mouse.move(intermediateX, intermediateY);
					if (delayMs > 0) {
						await new Promise((res) => setTimeout(res, delayMs));
					}
				}
				await page.mouse.move(targetX, targetY);
				await page.mouse.move(targetX, targetY);
				await page.mouse.up();
				return [true, 'Drag operation completed successfully'];
			} catch (e) {
				return [false, `Error during drag operation: ${String(e)}`];
			}
		}
		try {
			let sourceX = null,
				sourceY = null,
				targetX = null,
				targetY = null;
			const steps = Math.max(1, input.steps ?? 10);
			const delayMs = Math.max(0, input.delay_ms ?? 5);
			if (input.element_source && input.element_target) {
				const [sourceElement, targetElement] = await getDragElements(
					page,
					input.element_source,
					input.element_target,
				);
				if (!sourceElement || !targetElement) {
					return `Failed to find ${!sourceElement ? 'source' : 'target'} element`;
				}
				const [sourceCoords, targetCoords] = await getElementCoordinates(
					sourceElement,
					targetElement,
					input.element_source_offset,
					input.element_target_offset,
				);
				if (!sourceCoords || !targetCoords) {
					return `Failed to determine ${!sourceCoords ? 'source' : 'target'} coordinates`;
				}
				[sourceX, sourceY] = sourceCoords;
				[targetX, targetY] = targetCoords;
			} else if (
				[
					input.coord_source_x,
					input.coord_source_y,
					input.coord_target_x,
					input.coord_target_y,
				].every((coord) => coord !== undefined && coord !== null)
			) {
				sourceX = input.coord_source_x;
				sourceY = input.coord_source_y;
				targetX = input.coord_target_x;
				targetY = input.coord_target_y;
			} else {
				return 'Must provide either source/target selectors or source/target coordinates';
			}
			if (
				[sourceX, sourceY, targetX, targetY].some((coord) => coord === null || coord === undefined)
			) {
				return 'Failed to determine source or target coordinates';
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
				return message;
			}
			let msg;
			if (input.element_source && input.element_target) {
				msg = `🖱️ Dragged element '${input.element_source}' to '${input.element_target}'`;
			} else {
				msg = `🖱️ Dragged from (${sourceX}, ${sourceY}) to (${targetX}, ${targetY})`;
			}
			return msg;
		} catch (e) {
			const errorMsg = `Failed to perform drag and drop: ${String(e)}`;
			return errorMsg;
		}
	}

	@register({
		name: 'extract_content',
		description:
			'Extract page content to retrieve specific information from the page, e.g. all company names, a specific description, all information about xyc, 4 links with companies in structured format. Use include_links true if the goal requires links',
		schema: extractContentSchema,
	})
	async extractContent(input: z.infer<typeof extractContentSchema>) {
		const page = await this.browserAction.getCurrentPage();
		const turndownService = await getTurndownService(input.include_links);
		let content = turndownService.turndown(await this.browserAction.getPageHtml());
		for (const iframe of page.frames()) {
			if (iframe.url() !== page.url() && !iframe.url().startsWith('data:')) {
				content += `\n\nIFRAME ${iframe.url()}:\n`;
				content += turndownService.turndown(await iframe.content());
			}
		}
		let msg = '';
		try {
			if (input.goal) {
				const prompt =
					'Your task is to extract the content of the page. You will be given a page and a goal and you should extract all relevant information around this goal from the page. If the goal is vague, summarize the page. Respond in json format. Extraction goal: {goal}, Page: {page}';
				const template = new PromptTemplate({ inputVariables: ['goal', 'page'], template: prompt });
				const model = 'gpt-4o-mini';
				const pageExtractionLLM = new ChatOpenAI({ model, temperature: 0 });
				const output = (await template
					.pipe(pageExtractionLLM)
					.invoke({ goal: input.goal, page: content })) as { content: string };
				msg = `📄  Extracted from page\n: ${output.content}\n`;
			} else {
				msg = `📄  Extracted from page\n: ${content}\n`;
			}
		} catch (e) {
			console.debug(`Error extracting content: ${e}`);
			msg = `📄  Extracted from page\n: ${content}\n`;
		}
		console.info(msg);
		return msg;
	}

	@register({
		name: 'get_ax_tree',
		description:
			'Get the accessibility tree of the page in the format "role name" with the number_of_elements to return',
		schema: getAxTreeSchema,
	})
	async getAxTree(input: z.infer<typeof getAxTreeSchema>) {
		const page = await this.browserAction.getCurrentPage();
		const node = await page.accessibility.snapshot({ interestingOnly: true });
		function flattenAxTree(node: any, lines: string[]) {
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
		const msg = lines.slice(0, input.number_of_elements).join('\n');
		console.info(msg);
		return msg;
	}

	@register({
		name: 'get_dropdown_options',
		description: 'Get all options from a native dropdown',
		schema: getDropdownOptionsSchema,
	})
	async getDropdownOptions(input: z.infer<typeof getDropdownOptionsSchema>) {
		const selectorMap = await this.browserAction.getSelectorMap();
		const domElement = selectorMap.get(input.index);
		if (!domElement) {
			const msg = `Dropdown element with index ${input.index} not found in selector map.`;
			console.error(msg);
			return msg;
		}
		try {
			const page = await this.browserAction.getCurrentPage();
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
	}

	@register({
		name: 'go_back',
		description: 'Navigate back to the previous page',
		schema: goBackSchema,
	})
	async goBack(_input: z.infer<typeof goBackSchema>) {
		await this.browserAction.goBack();
		const msg = '🔙  Navigated back';
		console.info(msg);
		return msg;
	}

	@register({
		name: 'go_to_url',
		description: 'Navigate to URL in the current tab',
		schema: goToUrlSchema,
	})
	async goToUrl(input: z.infer<typeof goToUrlSchema>) {
		let page = await this.browserAction.getCurrentPage();
		if (page) {
			await page.goto(input.url);
			await page.waitForLoadState();
		} else {
			page = await this.browserAction.createNewTab(input.url);
		}
		const msg = `🔗  Navigated to ${input.url}`;
		console.info(msg);
		return msg;
	}

	@register({
		name: 'input_text',
		description: 'Input text into a input interactive element',
		schema: inputTextSchema,
	})
	async inputText(input: z.infer<typeof inputTextSchema>) {
		if (!(await this.browserAction.getSelectorMap()).has(input.index)) {
			throw new Error(
				`Element index ${input.index} does not exist - retry or use alternative actions`,
			);
		}
		const elementNode = await this.browserAction.getDomElementByIndex(input.index);
		if (!elementNode) {
			throw new Error(
				`Element index ${input.index} does not exist - retry or use alternative actions`,
			);
		}
		await this.browserAction.inputTextElementNode(elementNode, input.text);
		const msg = `⌨️  Input ${input.text} into index ${input.index}`;
		console.info(msg);
		return msg;
	}

	@register({
		name: 'open_tab',
		description: 'Open a specific url in new tab',
		schema: openTabSchema,
	})
	async openTab(input: z.infer<typeof openTabSchema>) {
		await this.browserAction.createNewTab(input.url);
		const msg = `🔗  Opened new tab with ${input.url}`;
		console.info(msg);
		return msg;
	}

	@register({
		name: 'save_pdf',
		description: 'Save the current page as a PDF file',
		schema: savePdfSchema,
	})
	async savePdf(_input: z.infer<typeof savePdfSchema>) {
		const page = await this.browserAction.getCurrentPage();
		const url = page.url();
		let shortUrl = url.replace(/^https?:\/\/(?:www\.)?/, '').replace(/\/$/, '');
		let slug = shortUrl
			.replace(/[^a-zA-Z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.toLowerCase();
		const sanitizedFilename = `${slug || 'page'}.pdf`;
		await page.emulateMedia({ media: 'screen' });
		await page.pdf({ path: sanitizedFilename, format: 'A4', printBackground: false });
		const msg = `Saving page with URL ${url} as PDF to ./${sanitizedFilename}`;
		console.info(msg);
		return msg;
	}

	@register({
		name: 'scroll_down',
		description: 'Scroll down the page by pixel amount - if none is given, scroll one page',
		schema: scrollDownSchema,
	})
	async scrollDown(input: z.infer<typeof scrollDownSchema>) {
		const page = await this.browserAction.getCurrentPage();
		const dy = input.amount ?? (await page.evaluate(() => window.innerHeight));
		try {
			await this.browserAction.scrollContainer(dy);
		} catch (e) {
			await page.evaluate((y) => window.scrollBy(0, y), dy);
			console.debug(`Smart scroll failed; used window.scrollBy fallback: ${e}`);
		}
		const amountStr = input.amount !== undefined ? `${input.amount} pixels` : 'one page';
		const msg = `🔍 Scrolled down the page by ${amountStr}`;
		console.info(msg);
		return msg;
	}

	@register({
		name: 'scroll_up',
		description: 'Scroll up the page by pixel amount - if none is given, scroll one page',
		schema: scrollUpSchema,
	})
	async scrollUp(input: z.infer<typeof scrollUpSchema>) {
		const page = await this.browserAction.getCurrentPage();
		const dy = -(input.amount ?? (await page.evaluate(() => window.innerHeight)));
		try {
			await this.browserAction.scrollContainer(dy);
		} catch (e) {
			await page.evaluate((y) => window.scrollBy(0, y), dy);
			console.debug(`Smart scroll failed; used window.scrollBy fallback: ${e}`);
		}
		const amountStr = input.amount !== undefined ? `${input.amount} pixels` : 'one page';
		const msg = `🔍 Scrolled up the page by ${amountStr}`;
		console.info(msg);
		return msg;
	}

	@register({
		name: 'scroll_to_text',
		description: 'If you dont find something which you want to interact with, scroll to it',
		schema: scrollToTextSchema,
	})
	async scrollToText(input: z.infer<typeof scrollToTextSchema>) {
		const page = await this.browserAction.getCurrentPage();
		const text = input.text;
		const locators = [
			page.getByText(text, { exact: false }),
			page.locator(`text=${text}`),
			page.locator(`//*[contains(text(), '${text}')]`),
		];
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
					console.info(msg);
					return msg;
				}
			} catch (e) {
				console.debug(`Locator attempt failed: ${String(e)}`);
				continue;
			}
		}
		const msg = `Text '${text}' not found or not visible on page.`;
		console.info(msg);
		return msg;
	}

	@register({
		name: 'search_google',
		description:
			'Search the query in Google, the query should be a search query like humans search in Google, concrete and not vague or super long.',
		schema: searchGoogleSchema,
	})
	async searchGoogle(input: z.infer<typeof searchGoogleSchema>) {
		let page = await this.browserAction.getCurrentPage();
		const searchUrl = `https://www.bing.com/search?q=${input.query}`;
		if (page) {
			await page.goto(searchUrl);
			await page.waitForLoadState();
		} else {
			page = await this.browserAction.createNewTab(searchUrl);
		}
		const msg = `🔍  Searched for "${input.query}" in Google`;
		console.info(msg);
		return msg;
	}

	@register({
		name: 'select_dropdown_option',
		description:
			'Select dropdown option for interactive element index by the text of the option you want to select',
		schema: selectDropdownOptionSchema,
	})
	async selectDropdownOption(input: z.infer<typeof selectDropdownOptionSchema>) {
		const selectorMap = await this.browserAction.getSelectorMap();
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
		const page = await this.browserAction.getCurrentPage();
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
	}

	@register({
		name: 'send_keys',
		description:
			'Send strings of special keys like Escape,Backspace, Insert, PageDown, Delete, Enter, Shortcuts such as `Control+o`, `Control+Shift+T` are supported as well. This gets used in keyboard.press',
		schema: sendKeysSchema,
	})
	async sendKeys(input: z.infer<typeof sendKeysSchema>) {
		const page = await this.browserAction.getCurrentPage();
		try {
			await page.keyboard.press(input.keys);
		} catch (e) {
			const err = e as Error;
			if (typeof err.message === 'string' && err.message.includes('Unknown key')) {
				for (const key of input.keys) {
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
		const msg = `⌨️  Sent keys: ${input.keys}`;
		console.info(msg);
		return msg;
	}

	@register({
		name: 'switch_tab',
		description: 'Switch to a tab.',
		schema: switchTabSchema,
	})
	async switchTab(input: z.infer<typeof switchTabSchema>) {
		await this.browserAction.switchToTab(input.page_id);
		const msg = `🔄  Switched to tab ${input.page_id}`;
		console.info(msg);
		return msg;
	}

	@register({
		name: 'wait',
		description: 'Wait for a specified time',
		schema: waitSchema,
	})
	async wait(input: z.infer<typeof waitSchema>) {
		const { sleep } = await import('./utils');
		await sleep(input.seconds * 1000);
		const msg = `🕒  Waited for ${input.seconds} seconds`;
		console.info(msg);
		return msg;
	}
	// #endregion

	getActions(page?: Page, includeActions: string[] = [], excludeActions: string[] = []) {
		return Array.from(this.descriptions.values())
			.filter(
				(description) => includeActions.length === 0 || includeActions.includes(description.name),
			)
			.filter((description) => {
				if (excludeActions.includes(description.name)) {
					return false;
				} else if (description.pageMatcher) {
					if (!page) {
						return false;
					}

					if (!description.pageMatcher(page)) {
						return false;
					}
				}
				return true;
			});
	}

	getPromptDescription(descriptions: ActionDescription[]) {
		const promptDescription = (actionDescription: ActionDescription): string => {
			let s = `${actionDescription.description}: \n`;
			s += `{${actionDescription.name}: `;
			const jsonSchema =
				actionDescription.schema instanceof z.ZodObject
					? zodToJsonSchema(actionDescription.schema)
					: actionDescription.schema;
			if ('properties' in jsonSchema === false) {
				throw new Error(`Action ${actionDescription.name} has no properties`);
			}

			const properties = jsonSchema.properties as Record<string, any>;

			s += JSON.stringify(Object.fromEntries(Object.entries(properties).map(([k, v]) => [k, v])));
			s += '}';
			return s;
		};
		return descriptions.map(promptDescription).join('\n');
	}
}

function cleanAttribute(attribute: string | null) {
	return attribute ? attribute.replace(/(\n+\s*)+/g, '\n') : '';
}

let turndownService: TurndownService;
async function getTurndownService(includeLinks: boolean = false) {
	if (turndownService) {
		return turndownService;
	}
	try {
		const turnDownService = new TurndownService({
			codeBlockStyle: 'fenced',
			preformattedCode: true,
			bulletListMarker: '-',
			emDelimiter: '_',
			strongDelimiter: '**',
			linkStyle: 'inlined',
		});
		turnDownService.addRule('remove-irrelevant', {
			filter: ['meta', 'style', 'script', 'noscript', 'link', 'textarea', 'select'],
			replacement: () => '',
		});
		turnDownService.addRule('truncate-svg', {
			filter: 'svg' as any,
			replacement: () => '',
		});
		turnDownService.addRule('title-as-h1', {
			filter: ['title'],
			replacement: (innerText) => `${innerText}\n===============\n`,
		});
		if (includeLinks) {
			turnDownService.addRule('improved-link', {
				filter: function (node, _options) {
					return Boolean(node.nodeName === 'A' && node.getAttribute('href'));
				},
				replacement: function (this: { references: string[] }, content, node: any) {
					var href = node.getAttribute('href');
					let title = cleanAttribute(node.getAttribute('title'));
					if (title) title = ` "${title.replace(/"/g, '\\"')}"`;
					const fixedContent = content.replace(/\s+/g, ' ').trim();
					const replacement = `[${fixedContent}]`;
					const reference = `[${fixedContent}]: ${href}${title}`;
					if (reference) {
						this.references.push(reference);
					}
					return replacement;
				},
				// @ts-ignore
				references: [],
				append: function (this: { references: string[] }) {
					let references = '';
					if (this.references.length) {
						references = `\n\n${this.references.join('\n')}\n\n`;
						this.references = []; // Reset references
					}
					return references;
				},
			});
		} else {
			turnDownService.addRule('remove-links', {
				filter: function (node, _options) {
					return Boolean(node.nodeName === 'A' && node.getAttribute('href'));
				},
				replacement: () => '',
			});
		}
		turnDownService.addRule('improved-heading', {
			filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
			replacement: (content, node, options) => {
				const hLevel = Number(node.nodeName.charAt(1));
				if (options.headingStyle === 'setext' && hLevel < 3) {
					const underline = repeat(hLevel === 1 ? '=' : '-', Math.min(128, content.length));
					return '\n\n' + content + '\n' + underline + '\n\n';
				} else {
					return '\n\n' + repeat('#', hLevel) + ' ' + content + '\n\n';
				}
			},
		});
		turnDownService.addRule('improved-paragraph', {
			filter: 'p',
			replacement: (innerText) => {
				const trimmed = innerText.trim();
				if (!trimmed) {
					return '';
				}
				return `${trimmed.replace(/\n{3,}/g, '\n\n')}\n\n`;
			},
		});
		turnDownService.addRule('improved-code', {
			filter: function (node: any) {
				let hasSiblings = node.previousSibling || node.nextSibling;
				let isCodeBlock = node.parentNode.nodeName === 'PRE' && !hasSiblings;
				return node.nodeName === 'CODE' && !isCodeBlock;
			},
			replacement: function (inputContent: any) {
				if (!inputContent) return '';
				let content = inputContent;
				let delimiter = '`';
				let matches = content.match(/`+/gm) || [];
				while (matches.indexOf(delimiter) !== -1) delimiter = delimiter + '`';
				if (content.includes('\n')) {
					delimiter = '```';
				}
				let extraSpace =
					delimiter === '```' ? '\n' : /^`|^ .*?[^ ].* $|`$/.test(content) ? ' ' : '';
				return (
					delimiter +
					extraSpace +
					content +
					(delimiter === '```' && !content.endsWith(extraSpace) ? extraSpace : '') +
					delimiter
				);
			},
		});
		turndownService = turnDownService;
	} catch (error) {
		throw new Error('Action `extract_content` requires the `turndown` packages to be installed');
	}
	return turndownService;
}

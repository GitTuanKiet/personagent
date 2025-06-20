import { z } from 'zod';
import { DynamicStructuredAction, type ActionResult } from '../base';
import { browserContainer, BrowserManager } from 'pag-browser';

export const getContentAction = new DynamicStructuredAction({
	name: 'get_content',
	description: 'Get the content of the page or the accessibility tree',
	schema: z.object({
		content_type: z
			.enum(['page', 'ax_tree'])
			.default('page')
			.describe('The type of content to get'),
		include_links: z
			.boolean()
			.optional()
			.default(false)
			.describe('Whether to include links in the output. Only used if content_type is page'),
		number_of_elements: z
			.number()
			.optional()
			.default(10)
			.describe('The number of elements to get. Only used if content_type is ax_tree'),
	}),
	func: async (input, _runManager, config) => {
		const instance = await DynamicStructuredAction.getBrowserSession(config);
		const content: ActionResult = [];

		const page = await instance.getCurrentPage();

		switch (input.content_type) {
			case 'page': {
				const turndownService = browserContainer
					.get(BrowserManager)
					.getTurndownService(input.include_links);
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
				const msg = lines.slice(0, input.number_of_elements).join('\n');
				content.push({ type: 'text', text: msg });
				break;
			}
			default: {
				throw new Error(`Unknown content_type: ${input.content_type}`);
			}
		}

		return content;
	},
});

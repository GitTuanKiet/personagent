import { z } from 'zod';
import { BrowserCallToolError, DynamicStructuredAction, getBrowserInstance } from '../base';
import { PromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import TurndownService from 'turndown';
import { repeat } from 'lodash';

export function cleanAttribute(attribute: string | null) {
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
		throw new BrowserCallToolError(
			'Action `extract_content` requires the `turndown` packages to be installed',
		);
	}

	return turndownService;
}

export const extractContentAction = new DynamicStructuredAction({
	name: 'extract_content',
	description:
		'Extract page content to retrieve specific information from the page, e.g. all company names, a specific description, all information about xyc, 4 links with companies in structured format. Use include_links true if the goal requires links',
	schema: z.object({
		goal: z
			.string()
			.optional()
			.describe(
				'The goal to extract from the page. If not provided, the tool will extract the entire page content.',
			),
		include_links: z.boolean().describe('Whether to include links in the output'),
	}),
	func: async (input, _runManager, config) => {
		const instance = getBrowserInstance();
		const page = await instance.getCurrentPage();
		const turndownService = await getTurndownService(input.include_links);
		let content = turndownService.turndown(await instance.getPageHtml());
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
				const model = config?.configurable?.model ?? 'gpt-4o-mini';
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
	},
});

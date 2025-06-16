import { singleton } from './di';
import { HistoryTreeProcessor } from './dom';
import TurndownService from 'turndown';
import { repeat } from 'lodash';
import { cleanAttribute } from './utils';
import { BrowserSession, type BrowserSessionArgs } from './session';
import { randomUUID } from 'node:crypto';

@singleton()
export class BrowserManager {
	private __cachedTurndownServices: [TurndownService | null, TurndownService | null] = [null, null];
	private __sessions: Map<string, BrowserSession> = new Map();

	constructor(public historyTreeProcessor: HistoryTreeProcessor) {}

	createSession({
		sessionId = randomUUID(),
		...args
	}: BrowserSessionArgs & { sessionId?: string }) {
		const session = new BrowserSession(args);
		this.__sessions.set(sessionId, session);

		return sessionId;
	}

	async getSession(sessionId: string): Promise<BrowserSession | undefined> {
		const session = this.__sessions.get(sessionId);
		if (session?.initialized === false) {
			await session.start();
		}

		return session;
	}

	async closeSession(sessionId: string): Promise<void> {
		const session = this.__sessions.get(sessionId);
		if (session) {
			await session.stop();
			this.__sessions.delete(sessionId);
		}
	}

	async getOrCreateSession({
		sessionId = randomUUID(),
		...args
	}: BrowserSessionArgs & { sessionId?: string }): Promise<BrowserSession> {
		const session = this.__sessions.get(sessionId);
		if (session) {
			return session;
		}
		this.createSession({ sessionId, ...args });

		return (await this.getSession(sessionId))!;
	}

	listSessionIds(): string[] {
		return Array.from(this.__sessions.keys());
	}

	getTurndownService(includeLinks: boolean = false): TurndownService {
		const index = includeLinks ? 0 : 1;
		if (this.__cachedTurndownServices?.[index]) {
			return this.__cachedTurndownServices[index];
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

			this.__cachedTurndownServices[index] = turnDownService;
		} catch (error) {
			throw new Error('Action `extract_content` requires the `turndown` packages to be installed');
		}

		return this.__cachedTurndownServices[index]!;
	}
}

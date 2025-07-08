import { singleton } from './di.js';
import { HistoryTreeProcessor } from './dom/index.js';
import TurndownService, { type TagName } from 'turndown';
import _ from 'lodash';
import { cleanAttribute } from './utils.js';
import { BrowserSession, type BrowserSessionArgs } from './session/index.js';
import { randomUUID } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'http';

@singleton()
export class BrowserManager {
	private __cachedTurndownServices: [TurndownService | null, TurndownService | null] = [null, null];
	private __sessions: Map<string, BrowserSession> = new Map();
	private __httpServer: import('http').Server | null = null;
	private __serverPort: number = 3001;
	private __serverHost: string = process.env.CONTAINER_NAME || 'localhost';

	constructor(public historyTreeProcessor: HistoryTreeProcessor) {
		this.startServer();
	}

	// #region Session Management
	createSession(sessionId: string = randomUUID(), args: BrowserSessionArgs = {}): string {
		this.__sessions.set(sessionId, new BrowserSession(args));

		return sessionId;
	}

	async getSession(sessionId: string): Promise<BrowserSession | undefined> {
		return this.__sessions.get(sessionId);
	}

	async getOrCreateSession(
		sessionId: string = randomUUID(),
		args: BrowserSessionArgs = {},
	): Promise<BrowserSession> {
		const session = this.__sessions.get(sessionId);
		if (session) {
			return session;
		}
		this.createSession(sessionId, args);

		return (await this.getSession(sessionId))!;
	}

	async closeSession(sessionId: string): Promise<void> {
		const session = this.__sessions.get(sessionId);
		if (session) {
			await session.stop();
			this.__sessions.delete(sessionId);
		}
	}

	// #endregion

	// #region Streaming Management
	createStreamUrl(sessionId: string): string {
		if (!this.__sessions.has(sessionId)) {
			throw new Error(
				`Session ${sessionId} not found. Create session first before getting stream URL.`,
			);
		}

		return `http://${this.__serverHost}:${this.__serverPort}/screenshot?sessionId=${sessionId}`;
	}

	private async startServer(): Promise<void> {
		if (this.__httpServer) return;

		this.__httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
			// Normalize URL for local access
			const requestUrl = new URL(
				req.url ?? '/',
				`http://${this.__serverHost}:${this.__serverPort}`,
			);

			// Only handle GET /screenshot requests
			if (req.method === 'GET' && requestUrl.pathname === '/screenshot') {
				const sessionId = requestUrl.searchParams.get('sessionId');

				if (!sessionId) {
					res.writeHead(400, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ error: 'sessionId parameter is required' }));
					return;
				}

				const session = await this.getSession(sessionId);
				const page = session?.agentCurrentPage;

				if (!page) {
					res.writeHead(404, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ error: 'Session or page not found' }));
					return;
				}

				try {
					const buffer = await page.screenshot({ type: 'jpeg', quality: 70, fullPage: false });
					res.writeHead(200, {
						'Content-Type': 'image/jpeg',
						'Content-Length': buffer.length,
						'Cache-Control': 'no-cache, no-store, must-revalidate',
					});
					res.end(buffer);
				} catch (error) {
					console.error(`Screenshot error ${sessionId}:`, error);
					res.writeHead(500, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ error: 'screenshot_error' }));
				}
				return;
			}

			// Fallback 404 for other routes
			res.writeHead(404);
			res.end();
		});

		this.__httpServer.listen(this.__serverPort, () => {
			console.log(`📸 Screenshot server ready on port ${this.__serverPort}`);
		});
	}

	getTurndownService(includeLinks: boolean = false): TurndownService {
		const index = includeLinks ? 0 : 1;
		if (this.__cachedTurndownServices?.[index]) {
			return this.__cachedTurndownServices[index];
		}

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
			filter: 'svg' as TagName,
			replacement: () => '',
		});
		turnDownService.addRule('title-as-h1', {
			filter: ['title'],
			replacement: (innerText) => `${innerText}\n===============\n`,
		});
		if (includeLinks) {
			turnDownService.addRule('improved-link', {
				filter: function (node) {
					return Boolean(node.nodeName === 'A' && node.getAttribute('href'));
				},
				replacement: function (this: { references: string[] }, content, node) {
					const href = (node as HTMLElement).getAttribute('href');
					let title = cleanAttribute((node as HTMLElement).getAttribute('title'));
					if (title) title = ` "${title.replace(/"/g, '\\"')}"`;
					const fixedContent = content.replace(/\s+/g, ' ').trim();
					const replacement = `[${fixedContent}]`;
					const reference = `[${fixedContent}]: ${href}${title}`;
					if (reference) {
						this.references.push(reference);
					}
					return replacement;
				},
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-expect-error
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
				filter: function (node) {
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
					const underline = _.repeat(hLevel === 1 ? '=' : '-', Math.min(128, content.length));
					return '\n\n' + content + '\n' + underline + '\n\n';
				} else {
					return '\n\n' + _.repeat('#', hLevel) + ' ' + content + '\n\n';
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
			filter: function (node) {
				const hasSiblings = node.previousSibling || node.nextSibling;
				const isCodeBlock = node.parentNode?.nodeName === 'PRE' && !hasSiblings;
				return node.nodeName === 'CODE' && !isCodeBlock;
			},
			replacement: function (inputContent) {
				if (!inputContent) return '';
				const content = inputContent;
				let delimiter = '`';
				const matches = (content.match(/`+/gm) || []) as RegExpMatchArray;
				while (matches.indexOf(delimiter) !== -1) delimiter = delimiter + '`';
				if (content.includes('\n')) {
					delimiter = '```';
				}
				const extraSpace =
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

		return this.__cachedTurndownServices[index]!;
	}
}

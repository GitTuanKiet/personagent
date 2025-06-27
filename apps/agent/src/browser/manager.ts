import { singleton } from './di.js';
import { HistoryTreeProcessor } from './dom/index.js';
import TurndownService, { type TagName } from 'turndown';
import _ from 'lodash';
import { cleanAttribute } from './utils.js';
import { BrowserSession, type BrowserSessionArgs } from './session/index.js';
import { randomUUID } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';

@singleton()
export class BrowserManager {
	private __cachedTurndownServices: [TurndownService | null, TurndownService | null] = [null, null];
	private __sessions: Map<string, BrowserSession> = new Map();
	private __wss: WebSocketServer | null = null;
	private __streamingSessions: Map<string, Set<WebSocket>> = new Map();
	private __sessionIntervals: Map<string, NodeJS.Timeout> = new Map();
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
		this.stopStreaming(sessionId);
		this.__streamingSessions.delete(sessionId);
	}

	// #endregion

	// #region Streaming Management
	createStreamUrl(sessionId: string): string {
		if (!this.__sessions.has(sessionId)) {
			throw new Error(
				`Session ${sessionId} not found. Create session first before getting stream URL.`,
			);
		}

		return `ws://${this.__serverHost}:${this.__serverPort}/stream?sessionId=${sessionId}`;
	}

	private async startServer(): Promise<void> {
		if (this.__wss) return;

		this.__wss = new WebSocketServer({ port: this.__serverPort, path: '/stream' });

		this.__wss.on('connection', (ws, req) => {
			const url = new URL(req.url!, `http://${req.headers.host}`);
			const sessionId = url.searchParams.get('sessionId');

			if (!sessionId) {
				ws.close(1008, 'Session ID required');
				return;
			}

			this.handleConnection(sessionId, ws);
		});

		console.log(`🎥 Stream server ready on port ${this.__serverPort}`);
	}

	private async handleConnection(sessionId: string, ws: WebSocket): Promise<void> {
		const session = await this.getSession(sessionId);
		if (!session) {
			ws.close(1008, 'Session not found');
			return;
		}

		// Add connection
		if (!this.__streamingSessions.has(sessionId)) {
			this.__streamingSessions.set(sessionId, new Set());
		}
		this.__streamingSessions.get(sessionId)!.add(ws);

		console.log(`📱 Client connected: ${sessionId}`);

		// Start streaming at 60 FPS
		this.startStreaming(sessionId);

		// Send first frame immediately
		this.sendFrame(sessionId);

		ws.on('close', () => {
			const sessionWs = this.__streamingSessions.get(sessionId);
			if (sessionWs) {
				sessionWs.delete(ws);
				if (sessionWs.size === 0) {
					this.stopStreaming(sessionId);
					this.__streamingSessions.delete(sessionId);
				}
			}
		});
	}

	private startStreaming(sessionId: string): void {
		if (this.__sessionIntervals.has(sessionId)) return;

		// 60 FPS = 16.67ms interval
		const timer = setInterval(() => this.sendFrame(sessionId), 1000 / 60);
		this.__sessionIntervals.set(sessionId, timer);
	}

	private stopStreaming(sessionId: string): void {
		const timer = this.__sessionIntervals.get(sessionId);
		if (timer) {
			clearInterval(timer);
			this.__sessionIntervals.delete(sessionId);
		}
	}

	private async sendFrame(sessionId: string): Promise<void> {
		try {
			const session = await this.getSession(sessionId);
			const page = session?.agentCurrentPage;
			const wsSet = this.__streamingSessions.get(sessionId);

			if (!page || !wsSet || wsSet.size === 0) return;

			const buffer = await page.screenshot({ type: 'jpeg', quality: 70, fullPage: false });
			const message = JSON.stringify({
				type: 'frame',
				data: buffer.toString('base64'),
				timestamp: Date.now(),
			});

			for (const ws of wsSet) {
				if (ws.readyState === WebSocket.OPEN) {
					ws.send(message);
				}
			}
		} catch (error) {
			console.error(`Frame error ${sessionId}:`, error);
		}
	}

	// #endregion

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

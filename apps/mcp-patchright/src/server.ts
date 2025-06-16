import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createMcpServer } from './mcp.js';
import { getUserDataDir } from './utils.js';
import { browserContainer, BrowserManager } from '@pag/browser-manager';
import { BunStreamableHTTPServerTransport } from './streamableHttp.js';

// Map to store transports by session ID
const transports: { [sessionId: string]: BunStreamableHTTPServerTransport } = {};

const PORT = 3000;

export default {
	port: PORT,
	async fetch(request, server) {
		const url = new URL(request.url);
		if (url.pathname === '/mcp') {
			switch (request.method) {
				case 'POST': {
					// Check for existing session ID
					const sessionId = request.headers.get('mcp-session-id');
					let transport: BunStreamableHTTPServerTransport;

					let body: unknown;
					if (sessionId && transports[sessionId]) {
						// Reuse existing transport
						transport = transports[sessionId];
					} else if (!sessionId && isInitializeRequest((body = await request.json()))) {
						const socketAddress = server.requestIP(request);
						const sessionId = socketAddress?.address ?? Bun.randomUUIDv7();

						// New initialization request
						transport = new BunStreamableHTTPServerTransport({
							sessionIdGenerator: () => sessionId,
							onsessioninitialized: (sessionId) => {
								// Store the transport by session ID
								transports[sessionId] = transport;
							},
						});

						const browserManager = browserContainer.get(BrowserManager);
						const instance = await browserManager.getOrCreateSession({
							sessionId,
							browserProfile: {
								stealth: true,
								headless: false,
								viewport: null,
								userDataDir: getUserDataDir(sessionId),
							},
						});

						// Clean up transport when closed
						transport.onclose = async () => {
							if (transport.sessionId) {
								await browserManager.closeSession(transport.sessionId);
								delete transports[transport.sessionId];
							}
						};

						const mcpServer = createMcpServer(instance);

						// Connect to the MCP server
						await mcpServer.connect(transport);
					} else {
						// Invalid request
						return new Response(
							JSON.stringify({
								jsonrpc: '2.0',
								error: {
									code: -32000,
									message: 'Bad Request: No valid session ID provided',
								},
								id: null,
							}),
							{
								status: 400,
								headers: {
									'Content-Type': 'application/json',
								},
							},
						);
					}

					// Handle the request
					return transport.handleRequest(request, body);
				}
				case 'GET':
				case 'DELETE': {
					const sessionId = request.headers.get('mcp-session-id');
					if (!sessionId || !transports[sessionId]) {
						return new Response(
							JSON.stringify({
								jsonrpc: '2.0',
								error: {
									code: -32000,
									message: 'Bad Request: Invalid or missing session ID',
								},
								id: null,
							}),
							{
								status: 400,
								headers: {
									'Content-Type': 'application/json',
								},
							},
						);
					}

					return transports[sessionId].handleRequest(request);
				}
			}
		}
		return new Response('Not found', { status: 404 });
	},
	idleTimeout: 255,
} satisfies Bun.Serve;

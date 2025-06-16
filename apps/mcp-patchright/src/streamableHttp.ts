import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import {
	JSONRPCMessage,
	isJSONRPCRequest,
	isJSONRPCResponse,
	isJSONRPCError,
	isInitializeRequest,
	JSONRPCMessageSchema,
	SUPPORTED_PROTOCOL_VERSIONS,
	JSONRPC_VERSION,
} from '@modelcontextprotocol/sdk/types.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import type {
	StreamId,
	EventId,
	EventStore,
	StreamableHTTPServerTransportOptions,
} from '@modelcontextprotocol/sdk/server/streamableHttp.js';

const DEFAULT_NEGOTIATED_PROTOCOL_VERSION = '2025-03-26';

export type { StreamId, EventId, EventStore, StreamableHTTPServerTransportOptions };

type ResponseContext =
	| {
			kind: 'sse';
			controller: ReadableStreamDefaultController<string>;
	  }
	| {
			kind: 'json';
			jsonResolver: (r: Response) => void;
	  };

export class BunStreamableHTTPServerTransport implements Transport {
	private sessionIdGenerator?: () => string;
	private _started: boolean = false;
	private _streamMapping: Map<string, ResponseContext> = new Map();
	private _requestToStreamMapping: Map<string | number, string> = new Map();
	private _requestResponseMap: Map<string | number, JSONRPCMessage> = new Map();
	private _initialized = false;
	private _enableJsonResponse: boolean = false;
	private _standaloneSseStreamId: string = '_GET_stream';
	private _eventStore?: EventStore;
	private _onsessioninitialized?: (sessionId: string) => void;

	sessionId?: string;
	onclose?: () => void;
	onerror?: (error: Error) => void;
	onmessage?: (message: JSONRPCMessage, extra?: { authInfo?: AuthInfo }) => void;

	constructor(options: StreamableHTTPServerTransportOptions) {
		this.sessionIdGenerator = options.sessionIdGenerator;
		this._enableJsonResponse = options.enableJsonResponse ?? false;
		this._eventStore = options.eventStore;
		this._onsessioninitialized = options.onsessioninitialized;
	}

	async start(): Promise<void> {
		if (this._started) {
			throw new Error('Transport already started');
		}
		this._started = true;
	}

	async handleRequest(req: Request, parseBody?: unknown): Promise<Response> {
		const method = req.method.toUpperCase();
		switch (method) {
			case 'POST':
				return this.handlePostRequest(req, parseBody);
			case 'GET':
				return this.handleGetRequest(req);
			case 'DELETE':
				return this.handleDeleteRequest(req);
			default:
				return this.handleUnsupportedRequest();
		}
	}

	private async handleGetRequest(req: Request): Promise<Response> {
		const acceptHeader = req.headers.get('accept');
		if (!acceptHeader?.includes('text/event-stream')) {
			return new Response(
				JSON.stringify({
					jsonrpc: JSONRPC_VERSION,
					error: {
						code: -32000,
						message: 'Not Acceptable: Client must accept text/event-stream',
					},
					id: null,
				}),
				{
					status: 406,
					headers: {
						'Content-Type': 'application/json',
					},
				},
			);
		}

		const sessionValidation = this.validateSession(req);
		if (sessionValidation) {
			return sessionValidation;
		}
		const protocolValidation = this.validateProtocolVersion(req);
		if (protocolValidation) {
			return protocolValidation;
		}

		if (this._eventStore) {
			const lastEventId = req.headers.get('last-event-id');
			if (lastEventId) {
				const replayResponse = await this.replayEvents(lastEventId);
				if (replayResponse) {
					return replayResponse;
				}
			}
		}

		if (this._streamMapping.get(this._standaloneSseStreamId) !== undefined) {
			return new Response(
				JSON.stringify({
					jsonrpc: JSONRPC_VERSION,
					error: {
						code: -32000,
						message: 'Conflict: Only one SSE stream is allowed per session',
					},
					id: null,
				}),
				{
					status: 409,
					headers: {
						'Content-Type': 'application/json',
					},
				},
			);
		}

		const headers = new Headers({
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive',
			...(this.sessionId ? { 'mcp-session-id': this.sessionId } : {}),
		});

		const stream = new ReadableStream<string>({
			start: (controller) => {
				this._streamMapping.set(this._standaloneSseStreamId, { kind: 'sse', controller });
			},
			cancel: () => {
				this._streamMapping.delete(this._standaloneSseStreamId);
			},
		});

		return new Response(stream, { status: 200, headers });
	}

	private async replayEvents(lastEventId: string): Promise<Response | undefined> {
		if (!this._eventStore) return;

		try {
			const headers = new Headers({
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache, no-transform',
				Connection: 'keep-alive',
				...(this.sessionId ? { 'mcp-session-id': this.sessionId } : {}),
			});

			let controllerRef: ReadableStreamDefaultController<string>;

			const stream = new ReadableStream<string>({
				start: async (controller) => {
					controllerRef = controller;

					const streamId = await this._eventStore!.replayEventsAfter(lastEventId, {
						send: async (eventId, message) => {
							if (!this.writeSSEEvent(controllerRef, message, eventId)) {
								this.onerror?.(new Error('Failed replay events'));
								controllerRef.close();
							}
						},
					});

					this._streamMapping.set(streamId, { kind: 'sse', controller: controllerRef });
				},

				cancel: () => {
					for (const [id, ctx] of this._streamMapping.entries()) {
						if (ctx.kind === 'sse' && ctx.controller === controllerRef) {
							this._streamMapping.delete(id);
							break;
						}
					}
				},
			});

			return new Response(stream, { status: 200, headers });
		} catch (error) {
			this.onerror?.(error as Error);
		}
	}

	private writeSSEEvent(
		controller: ReadableStreamDefaultController<string>,
		message: JSONRPCMessage,
		eventId?: string,
	): boolean {
		let eventData = `event: message\n`;
		if (eventId) {
			eventData += `id: ${eventId}\n`;
		}
		eventData += `data: ${JSON.stringify(message)}\n\n`;

		try {
			controller.enqueue(eventData);
			return true;
		} catch {
			return false;
		}
	}

	private async handleUnsupportedRequest(): Promise<Response> {
		return new Response(
			JSON.stringify({
				jsonrpc: JSONRPC_VERSION,
				error: {
					code: -32000,
					message: 'Method not allowed.',
				},
				id: null,
			}),
			{
				status: 405,
				headers: {
					Allow: 'GET, POST, DELETE',
				},
			},
		);
	}

	private async handlePostRequest(req: Request, parseBody?: unknown): Promise<Response> {
		const acceptHeader = req.headers.get('accept');
		if (
			!acceptHeader?.includes('application/json') ||
			!acceptHeader.includes('text/event-stream')
		) {
			return new Response(
				JSON.stringify({
					jsonrpc: JSONRPC_VERSION,
					error: {
						code: -32000,
						message:
							'Not Acceptable: Client must accept both application/json and text/event-stream',
					},
					id: null,
				}),
				{
					status: 406,
					headers: {
						'Content-Type': 'application/json',
					},
				},
			);
		}

		const ct = req.headers.get('content-type');
		if (!ct?.includes('application/json')) {
			return new Response(
				JSON.stringify({
					jsonrpc: JSONRPC_VERSION,
					error: {
						code: -32000,
						message: 'Unsupported Media Type: Content-Type must be application/json',
					},
					id: null,
				}),
				{
					status: 415,
					headers: {
						'Content-Type': 'application/json',
					},
				},
			);
		}

		const authInfo: AuthInfo | undefined = (req as { auth?: AuthInfo }).auth;

		let body = parseBody;
		if (body === undefined) {
			try {
				body = await req.json();
			} catch (error) {
				this.onerror?.(error as Error);
				return new Response(
					JSON.stringify({
						jsonrpc: JSONRPC_VERSION,
						error: {
							code: -32700,
							message: 'Parse error',
							data: String(error),
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
		}

		const messages = Array.isArray(body)
			? body.map((m) => JSONRPCMessageSchema.parse(m))
			: [JSONRPCMessageSchema.parse(body)];

		const isInitializationRequest = messages.some(isInitializeRequest);
		if (isInitializationRequest) {
			if (this._initialized && this.sessionId !== undefined) {
				return new Response(
					JSON.stringify({
						jsonrpc: JSONRPC_VERSION,
						error: {
							code: -32600,
							message: 'Invalid Request: Server already initialized',
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
			if (messages.length > 1) {
				return new Response(
					JSON.stringify({
						jsonrpc: JSONRPC_VERSION,
						error: {
							code: -32600,
							message: 'Invalid Request: Only one initialization request is allowed',
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
			this.sessionId = this.sessionIdGenerator?.();
			this._initialized = true;

			if (this.sessionId && this._onsessioninitialized) {
				this._onsessioninitialized(this.sessionId);
			}
		}

		if (!isInitializationRequest) {
			const sessionValidation = this.validateSession(req);
			if (sessionValidation) {
				return sessionValidation;
			}
			const protocolValidation = this.validateProtocolVersion(req);
			if (protocolValidation) {
				return protocolValidation;
			}
		}

		const hasRequests = messages.some(isJSONRPCRequest);
		if (!hasRequests) {
			for (const msg of messages) {
				this.onmessage?.(msg, { authInfo });
			}

			return new Response(null, { status: 202 });
		}

		const streamId = Bun.randomUUIDv7();

		for (const msg of messages) {
			if (isJSONRPCRequest(msg)) {
				this._requestToStreamMapping.set(msg.id, streamId);
			}
			this.onmessage?.(msg, { authInfo });
		}

		if (!this._enableJsonResponse) {
			const stream = new ReadableStream<string>({
				start: (controller) => {
					this._streamMapping.set(streamId, { kind: 'sse', controller });
				},
				cancel: () => {
					this._streamMapping.delete(streamId);
				},
			});

			const headers = {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive',
				...(this.sessionId ? { 'mcp-session-id': this.sessionId } : {}),
			};

			return new Response(stream, { status: 200, headers });
		} else {
			let resolveResponse!: (res: Response) => void;
			let rejectResponse!: (reason?: any) => void;
			const responsePromise = new Promise<Response>((res, rej) => {
				resolveResponse = res;
				rejectResponse = rej;
			});

			this._streamMapping.set(streamId, { kind: 'json', jsonResolver: resolveResponse });

			req.signal.addEventListener(
				'abort',
				() => {
					this._streamMapping.delete(streamId);
					rejectResponse(new DOMException('Request aborted', 'AbortError'));
				},
				{ once: true },
			);

			return responsePromise;
		}
	}

	private async handleDeleteRequest(req: Request): Promise<Response> {
		const sessionValidation = this.validateSession(req);
		if (sessionValidation) {
			return sessionValidation;
		}
		const protocolValidation = this.validateProtocolVersion(req);
		if (protocolValidation) {
			return protocolValidation;
		}
		await this.close();
		return new Response(null, { status: 200 });
	}

	private validateSession(req: Request): Response | undefined {
		if (this.sessionIdGenerator === undefined) {
			return;
		}

		if (!this._initialized) {
			return new Response(
				JSON.stringify({
					jsonrpc: JSONRPC_VERSION,
					error: {
						code: -32000,
						message: 'Bad Request: Server not initialized',
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

		const sessionId = req.headers.get('mcp-session-id');
		if (!sessionId) {
			return new Response(
				JSON.stringify({
					jsonrpc: JSONRPC_VERSION,
					error: {
						code: -32000,
						message: 'Bad Request: Mcp-Session-Id header is required',
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
		} else if (Array.isArray(sessionId)) {
			return new Response(
				JSON.stringify({
					jsonrpc: JSONRPC_VERSION,
					error: {
						code: -32000,
						message: 'Bad Request: Mcp-Session-Id header must be a string',
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
		} else if (sessionId !== this.sessionId) {
			return new Response(
				JSON.stringify({
					jsonrpc: JSONRPC_VERSION,
					error: {
						code: -32001,
						message: 'Session not found',
					},
					id: null,
				}),
				{
					status: 404,
					headers: {
						'Content-Type': 'application/json',
					},
				},
			);
		}

		return;
	}

	private validateProtocolVersion(req: Request): Response | undefined {
		let protocolVersion =
			req.headers.get('mcp-protocol-version') ?? DEFAULT_NEGOTIATED_PROTOCOL_VERSION;
		if (Array.isArray(protocolVersion)) {
			protocolVersion = protocolVersion[protocolVersion.length - 1];
		}

		if (!SUPPORTED_PROTOCOL_VERSIONS.includes(protocolVersion)) {
			return new Response(
				JSON.stringify({
					jsonrpc: JSONRPC_VERSION,
					error: {
						code: -32000,
						message: `Bad Request: Unsupported protocol version (supported versions: ${SUPPORTED_PROTOCOL_VERSIONS.join(', ')})`,
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

		return;
	}

	async close(): Promise<void> {
		for (const ctx of this._streamMapping.values()) {
			if (ctx.kind === 'sse') {
				ctx.controller.close();
			}
		}
		this._streamMapping.clear();
		this._requestResponseMap.clear();
		this.onclose?.();
	}

	async send(
		message: JSONRPCMessage,
		options?: { relatedRequestId?: string | number },
	): Promise<void> {
		let requestId = options?.relatedRequestId;
		if (isJSONRPCResponse(message) || isJSONRPCError(message)) {
			requestId = message.id;
		}

		if (requestId === undefined) {
			if (isJSONRPCResponse(message) || isJSONRPCError(message)) {
				throw new Error(
					'Cannot send a response on a standalone SSE stream unless resuming a previous client request',
				);
			}

			const standaloneSse = this._streamMapping.get(this._standaloneSseStreamId);
			if (!standaloneSse) {
				return;
			}

			let eventId: string | undefined;
			if (this._eventStore) {
				eventId = await this._eventStore.storeEvent(this._standaloneSseStreamId, message);
			}

			if ('controller' in standaloneSse) {
				this.writeSSEEvent(standaloneSse.controller, message, eventId);
			}
			return;
		}

		const streamId = this._requestToStreamMapping.get(requestId);
		const ctx = this._streamMapping.get(streamId!);
		if (!streamId || !ctx) {
			throw new Error(`No connection established for request ID: ${String(requestId)}`);
		}

		if (!this._enableJsonResponse) {
			let eventId: string | undefined;

			if (this._eventStore) {
				eventId = await this._eventStore.storeEvent(streamId, message);
			}

			if (ctx.kind === 'sse') {
				this.writeSSEEvent(ctx.controller, message, eventId);
			}
		}

		if (isJSONRPCResponse(message) || isJSONRPCError(message)) {
			this._requestResponseMap.set(requestId, message);
			const relatedIds = Array.from(this._requestToStreamMapping.entries())
				.filter(([_, sid]) => sid === streamId)
				.map(([id]) => id);

			const allResponsesReady = relatedIds.every((id) => this._requestResponseMap.has(id));

			if (allResponsesReady) {
				if (!ctx) {
					throw new Error(`No connection established for request ID: ${String(requestId)}`);
				}
				if (this._enableJsonResponse && ctx.kind === 'json') {
					const headers = {
						'Content-Type': 'application/json',
						...(this.sessionId ? { 'mcp-session-id': this.sessionId } : {}),
					};

					const responses = relatedIds.map((id) => this._requestResponseMap.get(id)!);

					ctx.jsonResolver(
						new Response(JSON.stringify(responses.length === 1 ? responses[0] : responses), {
							status: 200,
							headers,
						}),
					);
				} else if (ctx.kind === 'sse') {
					ctx.controller.close();
				}

				for (const id of relatedIds) {
					this._requestResponseMap.delete(id);
					this._requestToStreamMapping.delete(id);
				}
			}
		}
	}
}

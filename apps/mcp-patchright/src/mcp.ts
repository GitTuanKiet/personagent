import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
	ListPromptsRequestSchema,
	GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ToolSchemas } from './tools/schema.js';
import { type Content, handleTool } from './tools/handler.js';
import { BrowserSession } from '@pag/browser-manager';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const DEFAULT_ATTRIBUTES = [
	'title',
	'type',
	'name',
	'role',
	'aria-label',
	'placeholder',
	'value',
	'alt',
	'aria-expanded',
	'data-date-format',
];

// Error handling wrapper
async function withErrorHandling(
	operation: () => Promise<{ content: Content; isError: boolean }>,
	errorMessage: string,
): Promise<{ content: Content; isError: boolean }> {
	try {
		return await operation();
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return { content: [{ type: 'text', text: `${errorMessage}: ${msg}` }], isError: true };
	}
}

export function createMcpServer(session: BrowserSession) {
	// Initialize MCP server
	const server = new Server(
		{
			name: '@pag/mcp-patchright',
			version: '1.0.0',
		},
		{
			capabilities: {
				prompts: {},
				tools: {},
			},
		},
	);

	// Register tool handlers
	server.setRequestHandler(ListToolsRequestSchema, async () => ({
		tools: Object.entries(ToolSchemas).map(([name, schema]) => {
			const { description, ...inputSchema } = zodToJsonSchema(schema);
			delete inputSchema.$schema;
			return {
				name,
				description,
				inputSchema,
			};
		}),
	}));

	server.setRequestHandler(CallToolRequestSchema, async (request) => {
		const operation = async () => handleTool(session, request.params);

		return withErrorHandling(operation, `Failed to perform ${request.params.name}`);
	});

	// Register prompt handlers
	server.setRequestHandler(ListPromptsRequestSchema, async () => ({
		prompts: [
			{
				name: 'browser_state_summary',
				description: 'Get the current state of the browser',
			},
		],
	}));

	server.setRequestHandler(GetPromptRequestSchema, async (request) => {
		const { name } = request.params;
		switch (name) {
			case 'browser_state_summary': {
				const unavailableActions: string[] = [];

				const browserStateSummary = await session.getStateSummary(true);
				console.log({ url: browserStateSummary.url, tabs: browserStateSummary.tabs });
				let elementTreeText =
					browserStateSummary.elementTree.clickableElementsToString(DEFAULT_ATTRIBUTES);

				const hasContentAbove = (browserStateSummary.pixelsAbove || 0) > 0;
				const hasContentBelow = (browserStateSummary.pixelsBelow || 0) > 0;

				if (elementTreeText !== '') {
					if (hasContentAbove) {
						elementTreeText = `... ${browserStateSummary.pixelsAbove} pixels above - scroll or extract content to see more ...\n${elementTreeText}`;
					} else {
						elementTreeText = `[Start of page]\n${elementTreeText}`;
						unavailableActions.push('scroll_up');
					}
					if (hasContentBelow) {
						elementTreeText = `${elementTreeText}\n... ${browserStateSummary.pixelsBelow} pixels below - scroll or extract content to see more ...`;
					} else {
						elementTreeText = `${elementTreeText}\n[End of page]`;
						unavailableActions.push('scroll_down');
					}
				} else {
					elementTreeText = 'empty page';
				}

				const currentState = `Current url: ${browserStateSummary.url}
Available tabs: ${JSON.stringify(browserStateSummary.tabs)}
Interactive elements from top layer of the current page inside the viewport:
${elementTreeText}${unavailableActions.length > 0 ? `\n\nUnavailable actions: ${unavailableActions.join(', ')}` : ''}`;

				return {
					messages: [
						{
							role: 'assistant',
							content: {
								type: 'text',
								text: currentState,
							},
						},
					],
				};
			}
			default:
				throw new Error(`Unknown prompt: ${name}`);
		}
	});

	return server;
}

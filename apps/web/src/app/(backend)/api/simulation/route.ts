import { NextRequest } from 'next/server';
import { createBua } from '@pag/langgraph-bua';
import type { BUAState } from '@pag/langgraph-bua';

export async function POST(req: NextRequest) {
	const { configuration: configurationFromRequest, state: stateFromRequest } = await req.json();

	const buaParams = {
		...configurationFromRequest,
		browserProfile: {
			...configurationFromRequest.browserProfile,
			headless: true,
			viewport: undefined,
		},
		recursionLimit: 10,
	};

	const state: BUAState = {
		messages: [],
		...stateFromRequest,
	};

	const buaGraph = createBua(buaParams);

	const stream = new ReadableStream({
		async start(controller) {
			try {
				for await (const chunk of await buaGraph.stream(state, {
					maxConcurrency: 1,
					streamMode: 'values',
					signal: req.signal,
				})) {
					controller.enqueue(
						new TextEncoder().encode(`event: data\ndata: ${JSON.stringify(chunk)}\n\n`),
					);
				}
			} catch (err) {
				controller.enqueue(
					new TextEncoder().encode(
						`event: error\ndata: ${JSON.stringify({ error: String(err) })}\n\n`,
					),
				);
			} finally {
				controller.close();
			}
		},
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'application/x-ndjson',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
		},
	});
}

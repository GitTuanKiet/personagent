import { NextRequest } from 'next/server';
import { createBua } from '@pag/langgraph-bua';
import type { BUAState } from '@pag/langgraph-bua';

export async function POST(req: NextRequest) {
	const { configuration: configurationFromRequest, state: stateFromRequest } = await req.json();

	const configuration = {
		...configurationFromRequest,
		browserProfile: {
			...configurationFromRequest.browserProfile,
			headless: true,
		},
	};

	const state: BUAState = {
		messages: [],
		...stateFromRequest,
	};

	console.debug({ configuration, state });

	const buaGraph = createBua(configuration);

	const stream = new ReadableStream({
		async start(controller) {
			try {
				for await (const chunk of await buaGraph.stream(state, {
					maxConcurrency: 1,
					streamMode: 'updates',
				})) {
					console.log('🚀 ~ start ~ chunk:', chunk);
					controller.enqueue(
						new TextEncoder().encode(`event: data\ndata: ${JSON.stringify(chunk)}\n\n`),
					);
				}
				controller.close();
			} catch (err) {
				console.log('🚀 ~ start ~ err:', err);
				controller.enqueue(
					new TextEncoder().encode(
						`event: error\ndata: ${JSON.stringify({ error: String(err) })}\n\n`,
					),
				);
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

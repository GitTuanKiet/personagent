import { createClient } from '@/hooks/utils';
import type { StreamConfig, StreamWorkerMessage } from './types';
import type { Thread } from '@/types';

self.addEventListener('message', async (event: MessageEvent<StreamConfig>) => {
	try {
		const { threadId, assistantId, input, persona, sessionId, application } = event.data;
		const configurable = {
			persona,
			sessionId,
			browserProfile: {
				extraHTTPHeaders: application?.headers,
				storageState: {
					origin: [],
					cookies: application?.cookies
						? application.cookies.split(';').map((cookie) => cookie.trim().split('='))
						: [],
				},
			},
			url: application?.url,
		};

		const client = createClient();

		const thread = (await client.threads.get(threadId)) as unknown as Thread;
		if (thread.values?.isDone) {
			postMessage({
				type: 'done',
			} as StreamWorkerMessage);
			return;
		}

		const stream = client.runs.stream(threadId, assistantId, {
			input: input as Record<string, unknown>,
			streamMode: ['updates', 'messages-tuple'],
			config: {
				configurable,
			},
			streamResumable: true,
			multitaskStrategy: 'reject',
		});

		for await (const chunk of stream) {
			self.postMessage({
				type: 'chunk',
				chunk: JSON.stringify(chunk),
			} as StreamWorkerMessage);
		}

		self.postMessage({ type: 'done' } as StreamWorkerMessage);
	} catch (error) {
		self.postMessage({
			type: 'error',
			error: error instanceof Error ? error.message : String(error),
		} as StreamWorkerMessage);
	}
});

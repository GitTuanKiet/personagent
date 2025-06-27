import { createClient } from '@/hooks/utils';
import type { StreamConfig, StreamWorkerMessage } from './types';

self.addEventListener('message', async (event: MessageEvent<StreamConfig>) => {
	try {
		const { threadId, assistantId, input, modelName, modelConfigs, persona, application } =
			event.data;

		const client = createClient();

		const stream = client.runs.stream(threadId, assistantId, {
			input: input as Record<string, unknown>,
			streamMode: ['updates', 'messages-tuple'],
			config: {
				configurable: {
					modelName: modelName,
					modelConfig: modelConfigs[modelName],
					persona,
					useVision: application?.useVision,
					browserProfile: application?.browserProfile,
					sessionId: application?.id,
				},
				recursion_limit: application?.recursionLimit,
			},
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

import type { UpdatesStreamEvent, MessagesTupleStreamEvent } from '@langchain/langgraph-sdk';
import type { StreamWorkerMessage, StreamConfig } from './types';
import type { Thread, ThreadState } from '@/types';
import { createClient } from '@/hooks/utils';

export class StreamWorkerService {
	private worker: Worker;

	constructor() {
		this.worker = new Worker(new URL('./worker.ts', import.meta.url));
	}

	async *streamData(
		config: StreamConfig,
	): AsyncGenerator<UpdatesStreamEvent<ThreadState> | MessagesTupleStreamEvent> {
		const client = createClient();

		const thread = (await client.threads.get(config.threadId)) as unknown as Thread;
		console.log('🚀 ~ StreamWorkerService ~ thread:', thread);
		if (thread.values?.isDone) {
			return;
		}

		this.worker.postMessage(config);

		while (true) {
			const event: MessageEvent<StreamWorkerMessage> = await new Promise((resolve) => {
				this.worker.onmessage = resolve;
			});

			const { type } = event.data;

			if (type === 'error') {
				throw new Error(event.data.error);
			}

			if (type === 'chunk') {
				yield JSON.parse(event.data.chunk);
			}

			if (type === 'done') {
				break;
			}
		}
	}

	terminate() {
		this.worker.terminate();
	}
}

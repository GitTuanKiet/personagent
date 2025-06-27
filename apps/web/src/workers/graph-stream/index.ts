import type { UpdatesStreamEvent, MessagesTupleStreamEvent } from '@langchain/langgraph-sdk';
import type { StreamWorkerMessage, StreamConfig } from './types';
import type { Simulation } from '@/types';

export class StreamWorkerService {
	private worker: Worker;

	constructor() {
		this.worker = new Worker(new URL('./worker.ts', import.meta.url));
	}

	async *streamData(
		config: StreamConfig,
	): AsyncGenerator<UpdatesStreamEvent<Simulation> | MessagesTupleStreamEvent> {
		this.worker.postMessage(config);

		while (true) {
			const event: MessageEvent<StreamWorkerMessage> = await new Promise((resolve) => {
				this.worker.onmessage = resolve;
			});

			const { type } = event.data;
			console.log('🚀 ~ StreamWorkerService ~ *streamData ~ event.data:', event.data);

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

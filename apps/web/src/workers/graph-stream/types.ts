import type { GraphInput, Persona } from '@/types';
import type { Application } from '@/lib/appApi';

export type StreamWorkerMessage =
	| {
			type: 'chunk';
			chunk: string;
	  }
	| {
			type: 'done';
	  }
	| {
			type: 'error';
			error: string;
	  };

export interface StreamConfig {
	threadId: string;
	assistantId: string;
	sessionId: string;
	input: GraphInput;
	persona?: Persona;
	application?: Application;
}

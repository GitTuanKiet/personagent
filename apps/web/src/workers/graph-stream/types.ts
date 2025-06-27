import { ALL_MODEL_NAMES } from '@/lib/models';
import type { CustomModelConfig } from '@/lib/models';
import type { Application, GraphInput, Persona } from '@/types';

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
	input: GraphInput;
	modelName: ALL_MODEL_NAMES;
	modelConfigs: Record<string, CustomModelConfig>;
	persona?: Persona;
	application?: Application;
}

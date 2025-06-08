import { expect, test } from 'bun:test';
import { Annotation } from '@langchain/langgraph';
import type { BUAState, BUAUpdate } from '../types.js';
import { createBua } from '../index.js';

test('Can extend the state with a custom annotation', () => {
	const CustomAnnotation = Annotation.Root({
		foo: Annotation<string>,
	});

	type CustomState = BUAState & typeof CustomAnnotation.State;
	type CustomStateUpdate = BUAUpdate & typeof CustomAnnotation.Update;

	const beforeNode = async (_state: CustomState): Promise<CustomStateUpdate> => {
		return {};
	};

	const afterNode = async (_state: CustomState): Promise<CustomStateUpdate> => {
		return {};
	};

	// Ensure this does not throw a type error
	const graph = createBua({
		stateModifier: CustomAnnotation,
		nodeBeforeAction: beforeNode,
		nodeAfterAction: afterNode,
	});

	expect(graph).toBeDefined();
});

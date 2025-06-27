import { END, START, StateGraph } from '@langchain/langgraph';
import { executeAction } from './nodes/execute-action.js';
import { callModel } from './nodes/call-model.js';
import { createBrowser } from './nodes/create-browser.js';
import { analyzeUsability } from './nodes/analyze-usability.js';
import { validator } from './nodes/validator.js';
import type { BUAState } from './state.js';
import { BUAAnnotation } from './state.js';
import { BUAConfigurable } from './configuration.js';

/**
 * Routes to the nodeBeforeAction node if a computer call is present
 * in the last message, otherwise routes to END.
 *
 * @param {BUAState} state The current state of the thread.
 * @returns {"nodeBeforeAction" | typeof END | "createBrowser"} The next node to execute.
 */
function takeActionOrEnd(state: BUAState): 'createBrowser' | 'executeAction' | typeof END {
	if (state.actions.length === 0) {
		return END;
	}

	if (!state.streamUrl) {
		return 'createBrowser';
	}

	return 'executeAction';
}

/**
 * Routes to the analyzeUsability node if task is done, otherwise continues with callModel.
 *
 * @param {BUAState} state The current state of the thread.
 * @returns {"callModel" | "analyzeUsability"} The next node to execute.
 */
function reinvokeModelOrAnalyze(state: BUAState): 'callModel' | 'analyzeUsability' {
	if (state.isDone) {
		return 'analyzeUsability';
	}

	return 'callModel';
}

function takeModelOrEnd(state: BUAState): 'callModel' | typeof END {
	if (state.isSimulatedPrompt) {
		return 'callModel';
	}

	return END;
}

const workflow = new StateGraph(BUAAnnotation, BUAConfigurable)
	.addNode('validator', validator)
	.addNode('callModel', callModel)
	.addNode('createBrowser', createBrowser)
	.addNode('executeAction', executeAction)
	.addNode('analyzeUsability', analyzeUsability)
	.addEdge(START, 'validator')
	.addConditionalEdges('validator', takeModelOrEnd, ['callModel', END])
	.addConditionalEdges('callModel', takeActionOrEnd, ['createBrowser', 'executeAction', END])
	.addEdge('createBrowser', 'executeAction')
	.addConditionalEdges('executeAction', reinvokeModelOrAnalyze, ['callModel', 'analyzeUsability'])
	.addEdge('analyzeUsability', END);

export const graph = workflow.compile({
	interruptBefore: [],
	interruptAfter: [],
});

graph.name = 'Browser Use Agent';

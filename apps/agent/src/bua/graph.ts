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
 * @returns {"executeAction" | typeof END} The next node to execute.
 */
function takeActionOrEnd(state: BUAState): 'executeAction' | typeof END {
	if (state.isDone || state.actions.length === 0) {
		return END;
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

function takeBrowserOrModelOrEnd(state: BUAState): 'createBrowser' | 'callModel' | typeof END {
	if (!state.streamUrl) {
		return 'createBrowser';
	}

	if (state.isSimulatedPrompt) {
		return 'callModel';
	}

	return END;
}

const workflow = new StateGraph(BUAAnnotation, BUAConfigurable)
	.addNode('validator', validator)
	.addNode('createBrowser', createBrowser)
	.addNode('callModel', callModel)
	.addNode('executeAction', executeAction)
	.addNode('analyzeUsability', analyzeUsability)
	.addEdge(START, 'validator')
	.addConditionalEdges('validator', takeBrowserOrModelOrEnd, ['createBrowser', 'callModel', END])
	.addEdge('createBrowser', 'callModel')
	.addConditionalEdges('callModel', takeActionOrEnd, ['executeAction', END])
	.addConditionalEdges('executeAction', reinvokeModelOrAnalyze, ['callModel', 'analyzeUsability'])
	.addEdge('analyzeUsability', END);

export const graph = workflow.compile({
	interruptBefore: [],
	interruptAfter: [],
});

graph.name = 'Browser Use Agent';

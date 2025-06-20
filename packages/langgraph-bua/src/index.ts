import type { AnnotationRoot, LangGraphRunnableConfig } from '@langchain/langgraph';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { SystemMessage } from '@langchain/core/messages';
import { executeAction } from './nodes/execute-action';
import { callModel } from './nodes/call-model.js';
import { createBrowser } from './nodes/create-browser';
import type { BUAState, BUAUpdate } from './types.js';
import { BUAAnnotation, BUAConfigurable } from './types';
import type { IBrowserProfile } from 'pag-browser';

/**
 * Routes to the nodeBeforeAction node if a computer call is present
 * in the last message, otherwise routes to END.
 *
 * @param {BUAState} state The current state of the thread.
 * @returns {"nodeBeforeAction" | typeof END | "createBrowser"} The next node to execute.
 */
function takeActionOrEnd(state: BUAState): 'nodeBeforeAction' | 'createBrowser' | typeof END {
	if (state.actions.length === 0) {
		return END;
	}

	if (!state.browserPid) {
		return 'createBrowser';
	}

	return 'nodeBeforeAction';
}

/**
 * Routes to the callModel node if a computer call output is present,
 * otherwise routes to END.
 *
 * @param {BUAState} state The current state of the thread.
 * @returns {"callModel" | typeof END} The next node to execute.
 */
function reinvokeModelOrEnd(state: BUAState): 'callModel' | typeof END {
	if (state.messages.length > 0) {
		const lastMessage = state.messages[state.messages.length - 1]!;
		// If the last message is a done action, end the thread.
		if (lastMessage.name === 'done') {
			return END;
		}

		return 'callModel';
	}

	return 'callModel';
}

/**
 * Configuration for the Computer Use Agent.
 */
export interface CreateBuaParams<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	StateModifier extends AnnotationRoot<any> = typeof BUAAnnotation,
> {
	/**
	 * The maximum number of recursive calls the agent can make.
	 * @default 100
	 */
	recursionLimit?: number;
	/**
	 * The model to use for the agent.
	 * @default gpt-4o-mini
	 */
	model?: string;
	/**
	 * The browser profile to use for the agent.
	 * @default undefined
	 */
	browserProfile?: IBrowserProfile;
	/**
	 * The prompt to use for the model. This will be expanded into a system message.
	 * @default undefined
	 */
	prompt?: string | SystemMessage;
	/**
	 * Whether to use vision model to capture the screen.
	 * @default false
	 */
	useVision?: boolean;
	/**
	 * The id of the browser session to use for this thread.
	 */
	sessionId?: string;
	/**
	 * A custom node to run before the computer action.
	 * @default undefined
	 */
	nodeBeforeAction?: (
		state: BUAState & StateModifier['State'],
		config: LangGraphRunnableConfig<typeof BUAConfigurable.State>,
	) => Promise<BUAUpdate & StateModifier['Update']>;

	/**
	 * A custom node to run after the browser action.
	 * @default undefined
	 */
	nodeAfterAction?: (
		state: BUAState & StateModifier['State'],
		config: LangGraphRunnableConfig<typeof BUAConfigurable.State>,
	) => Promise<BUAUpdate & StateModifier['Update']>;

	/**
	 * Optional state modifier for customizing the agent's state.
	 * @default undefined
	 */
	stateModifier?: StateModifier;
}

/**
 * Creates and configures a Computer Use Agent.
 *
 * @returns The configured graph.
 */
export function createBua<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	StateModifier extends AnnotationRoot<any> = typeof BUAAnnotation,
>({
	recursionLimit = 100,
	model,
	browserProfile,
	prompt,
	useVision,
	nodeBeforeAction,
	nodeAfterAction,
	stateModifier,
	sessionId,
}: CreateBuaParams<StateModifier> = {}) {
	const nodeBefore = nodeBeforeAction ?? (async () => {});
	const nodeAfter = nodeAfterAction ?? (async () => {});

	const StateAnnotation = Annotation.Root({
		...BUAAnnotation.spec,
		...stateModifier?.spec,
	});

	const workflow = new StateGraph(StateAnnotation, BUAConfigurable)
		.addNode('callModel', callModel)
		.addNode('createBrowser', createBrowser)
		.addNode('nodeBeforeAction', nodeBefore)
		.addNode('nodeAfterAction', nodeAfter)
		.addNode('executeAction', executeAction)
		.addEdge(START, 'callModel')
		.addConditionalEdges('callModel', takeActionOrEnd, ['createBrowser', 'nodeBeforeAction', END])
		.addEdge('nodeBeforeAction', 'executeAction')
		.addEdge('executeAction', 'nodeAfterAction')
		.addEdge('createBrowser', 'nodeBeforeAction')
		.addConditionalEdges('nodeAfterAction', reinvokeModelOrEnd, ['callModel', END]);

	const buaGraph = workflow.compile();
	buaGraph.name = 'Browser Use Agent';

	// Configure the graph with the provided parameters
	const configuredGraph = buaGraph.withConfig({
		configurable: {
			model,
			browserProfile,
			prompt,
			useVision,
			sessionId,
		},
		recursionLimit,
	});

	return configuredGraph;
}

export {
	type BUAState,
	type BUAUpdate,
	BUAAnnotation,
	BUAConfigurable,
} from './types.js';
export { getToolCalls, isBrowserCallToolMessage } from './utils.js';
export * from 'pag-browser';
export type { BrowserTool } from './tools';

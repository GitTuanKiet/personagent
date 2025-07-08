import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { isGraphInterrupt } from '@langchain/langgraph';
import { BaseMessage, ToolMessage } from '@langchain/core/messages';
import { BrowserManager, browserContainer, DOMElementNode } from '../../browser/index.js';
import { ensureConfiguration } from '../configuration.js';
import { BROWSER_TOOLS } from '../tools/index.js';
import type { DynamicStructuredAction } from '../tools/base.js';
import type { BUAState, BUAUpdate, BrowserToolCall } from '../state.js';

export async function executeAction(
	state: BUAState,
	config: LangGraphRunnableConfig,
): Promise<BUAUpdate> {
	const browserManager = browserContainer.get(BrowserManager);

	const { sessionId } = ensureConfiguration(config);
	const { actions, nSteps: currentNSteps } = state;
	if (!sessionId) {
		throw new Error('Cannot execute action without a browser session id');
	}

	const session = await browserManager.getSession(sessionId);
	if (!session) {
		throw new Error('Cannot execute action without a browser session');
	}

	const cachedSelectorMap = await session.getSelectorMap();
	const cachedPathHashes = new Set(
		Object.values(cachedSelectorMap).map((e: DOMElementNode) => e.hash.branchPathHash),
	);

	let nSteps = currentNSteps;
	let isDone = false;

	const messages: BaseMessage[] = [];
	const performedActions: BrowserToolCall[] = [];

	for (const [i, action] of actions.entries()) {
		const tool = BROWSER_TOOLS[
			action.name as keyof typeof BROWSER_TOOLS
		] as DynamicStructuredAction;

		if ('index' in action.args && i !== 0) {
			const index = action.args.index;
			const newSelectorMap = (await session.getStateSummary(false)).selectorMap;

			// Detect index change after previous action
			const origTarget = cachedSelectorMap.get(index);
			const origTargetHash = origTarget ? origTarget.hash.branchPathHash : null;
			const newTarget = newSelectorMap.get(index);
			const newTargetHash = newTarget ? newTarget.hash.branchPathHash : null;
			if (origTargetHash !== newTargetHash) {
				const msg = `Element index changed after action ${action.name} with args ${JSON.stringify(action.args)}, because page changed.`;
				console.info(msg);
				nSteps++;
				break;
			}

			const newPathHashes = new Set(
				Array.from(newSelectorMap.values()).map((e) => e.hash.branchPathHash),
			);

			const hasNewElements = Array.from(newPathHashes).some((hash) => !cachedPathHashes.has(hash));
			if (hasNewElements) {
				// next action requires index but there are new elements on the page
				const msg = `Something new appeared after action ${action.name} with args ${JSON.stringify(action.args)}`;
				console.info(msg);
				nSteps++;
				break;
			}
		}

		let output;
		try {
			output = await tool.invoke(action, config);
			output.status = 'success';
			performedActions.push(action);
		} catch (e) {
			if (isGraphInterrupt(e)) {
				// `NodeInterrupt` errors are a breakpoint to bring a human into the loop.
				// As such, they are not recoverable by the agent and shouldn't be fed
				// back. Instead, re-throw these errors even when `handleToolErrors = true`.
				throw e;
			}
			if (output) {
				output.status = 'error';
			} else {
				output = new ToolMessage({
					name: action.name,
					content: e instanceof Error ? e.message : String(e),
					status: 'error',
					tool_call_id: action.id!,
				});
			}
		}

		if (action.name === 'done') {
			isDone = true;
			break;
		}

		messages.push(output);
	}

	return {
		messages,
		nSteps,
		actions: performedActions,
		isDone,
	};
}

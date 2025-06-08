import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { isGraphInterrupt } from '@langchain/langgraph';
import { AIMessage } from '@langchain/core/messages';
import type { BrowserToolCallResult, BUAState, BUAUpdate } from '../types';
import type { DynamicStructuredAction } from '../tools';
import { BROWSER_TOOLS } from '../tools';
import { BrowserError, BrowserAction, browserContainer, DOMElementNode } from '../browser';
import type { z } from 'zod';
import { sleep } from '../browser/utils';
import type { BrowserToolCall } from '../utils';

export async function executeAction(
	state: BUAState,
	config: LangGraphRunnableConfig,
): Promise<BUAUpdate> {
	const browserAction = browserContainer.get(BrowserAction);

	const { sessionId, actions, nSteps: currentNSteps } = state;
	if (!sessionId) {
		throw new BrowserError('Cannot execute action without a browser session id');
	}

	const cachedSelectorMap = await browserAction.getSelectorMap();
	const cachedPathHashes = new Set(
		Object.values(cachedSelectorMap).map((e: DOMElementNode) => e.hash.branchPathHash),
	);

	let nSteps = currentNSteps;

	const messages: AIMessage[] = [];
	const results: BrowserToolCallResult[] = [];
	const performedActions: BrowserToolCall[] = [];

	for (const [i, action] of actions.entries()) {
		const tool = BROWSER_TOOLS[action.name]! as DynamicStructuredAction<z.AnyZodObject>;

		if ('index' in action.args && i !== 0) {
			const index = action.args.index;
			const newSelectorMap = (await browserAction.getStateSummary(false)).selectorMap;

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
			if (!newPathHashes.isSubsetOf(cachedPathHashes)) {
				// next action requires index but there are new elements on the page
				const msg = `Something new appeared after action ${action.name} with args ${JSON.stringify(action.args)}`;
				console.info(msg);
				nSteps++;
				break;
			}
		}

		try {
			const output = await tool.invoke(action, config);

			if (output.name === 'thinking') {
				messages.push(new AIMessage({ content: output.content }));
			} else {
				results.push({
					action: action.name,
					result: typeof output === 'string' ? output : (output.content as string),
				});
				performedActions.push(action);
			}

			await sleep(browserAction.session.browserProfile.waitBetweenActions);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (e: any) {
			if (isGraphInterrupt(e)) {
				// `NodeInterrupt` errors are a breakpoint to bring a human into the loop.
				// As such, they are not recoverable by the agent and shouldn't be fed
				// back. Instead, re-throw these errors even when `handleToolErrors = true`.
				throw e;
			}
			results.push({
				action: action.name,
				result: `❌ Error: ${e.message}\n Please fix your mistakes.`,
			});
		}
	}

	return {
		sessionId: browserAction.session.browserPid?.toString(),
		messages,
		results,
		nSteps,
		actions: performedActions,
	};
}

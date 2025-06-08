import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import type { BrowserToolCallResult, BUAState, BUAUpdate } from '../types';
import { getConfigurationWithDefaults } from '../types';
import { getAvailableActions } from '../tools';
import { SYSTEM_PROMPT_TEMPLATE } from '../prompt';
import { getToolCalls, type BrowserToolCall } from '../utils';
import { BrowserAction, browserContainer } from '../browser';
import { RunnableLambda } from '@langchain/core/runnables';

const _sysMessageToPrompt = (sysMessage: string | SystemMessage | undefined) => {
	if (typeof sysMessage === 'string') {
		return sysMessage;
	}
	return sysMessage?.content;
};

async function pruneResults(results: BrowserToolCallResult[]): Promise<BrowserToolCallResult[]> {
	const prunedResults: BrowserToolCallResult[] = [];
	// let foundFirstGetAxTree = false;
	let foundFirstExtractContent = false;

	for (let i = results.length - 1; i >= 0; i--) {
		const result = results[i]!;

		// if (result.action === "get_ax_tree") {
		//     if (!foundFirstGetAxTree) {
		//         prunedResults.push(result);
		//         foundFirstGetAxTree = true;
		//         continue;
		//     }
		// } else
		if (result.action === 'extract_content') {
			if (!foundFirstExtractContent) {
				prunedResults.push(result);
				foundFirstExtractContent = true;
				continue;
			}
		}

		prunedResults.push(result);
	}

	return prunedResults.reverse();
}

const pruneResultsRunnable = RunnableLambda.from(pruneResults).withConfig({
	runName: 'prune-results',
});

/**
 * Invokes the computer preview model with the given messages.
 *
 * @param {BUAState} state - The current state of the thread.
 * @param {LangGraphRunnableConfig} config - The configuration to use.
 * @returns {Promise<BUAUpdate>} - The updated state with the model's response.
 */
export async function callModel(
	state: BUAState,
	config: LangGraphRunnableConfig,
): Promise<BUAUpdate> {
	let browserAction: BrowserAction | null = null;

	const configuration = getConfigurationWithDefaults(config);
	const { sessionId, messages, actions: performedActions, results, nSteps } = state;
	let currentState;

	const excludeActions: string[] = results.length > 0 ? [results[results.length - 1]!.action] : [];

	if (sessionId) {
		browserAction = browserContainer.get(BrowserAction);
		const browserStateSummary = await browserAction.getStateSummary(true);
		let elementTreeText = browserStateSummary.elementTree.clickableElementsToString(
			configuration.includeAttributes,
		);

		const hasContentAbove = (browserStateSummary.pixelsAbove || 0) > 0;
		const hasContentBelow = (browserStateSummary.pixelsBelow || 0) > 0;

		if (elementTreeText !== '') {
			if (hasContentAbove) {
				elementTreeText = `... ${browserStateSummary.pixelsAbove} pixels above - scroll or extract content to see more ...\n${elementTreeText}`;
			} else {
				elementTreeText = `[Start of page]\n${elementTreeText}`;
				excludeActions.push('scroll_up');
			}
			if (hasContentBelow) {
				elementTreeText = `${elementTreeText}\n... ${browserStateSummary.pixelsBelow} pixels below - scroll or extract content to see more ...`;
			} else {
				elementTreeText = `${elementTreeText}\n[End of page]`;
				excludeActions.push('scroll_down');
			}
		} else {
			elementTreeText = 'empty page';
		}

		currentState = `Current url: ${browserStateSummary.url}
Available tabs: ${JSON.stringify(browserStateSummary.tabs)}
Interactive elements from top layer of the current page inside the viewport:
${elementTreeText}`;

		if (configuration.useVision && browserStateSummary.screenshot) {
			messages.push(
				new HumanMessage({
					content: [
						{
							type: 'image_url',
							image_url: {
								url: `data:image/png;base64,${browserStateSummary.screenshot}`,
							},
						},
					],
				}),
			);
		}
	} else {
		currentState = `No state`;
	}

	const history = (await pruneResultsRunnable.invoke(results))
		.map((result) => `${result.action}: ${result.result}`)
		.join('\n');

	const systemPrompt = await SYSTEM_PROMPT_TEMPLATE.format({
		thinking_rule: excludeActions.includes('thinking')
			? ''
			: `### Reflective behavior and troubleshooting
- If you repeat the same action more than once and it does not change the page or result, STOP and use the \`thinking\` tool.
- Before retrying any action (like scroll or click), ask yourself: *Did this work last time? What could be wrong?*
- Use \`thinking\` to reason through uncertainty, unexpected page behavior, or ambiguous content.`,
		current_state: currentState,
		performed_actions: history,
		prompt: _sysMessageToPrompt(configuration.prompt),
	});

	const modelWithTools = new ChatOpenAI({
		model: configuration.model,
		temperature: 0,
	}).bindTools(getAvailableActions(await browserAction?.getCurrentPage(), excludeActions), {
		parallel_tool_calls: true,
	});

	const response = await modelWithTools.invoke([new SystemMessage(systemPrompt), ...messages]);
	const browserToolCalls = (getToolCalls(response) ?? []) as BrowserToolCall[];

	return {
		...(browserToolCalls.length > 0
			? {
					actions: browserToolCalls,
				}
			: {
					messages: response,
				}),
		scripts: { [nSteps]: performedActions },
	};
}

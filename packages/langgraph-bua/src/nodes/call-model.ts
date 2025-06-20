import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import type { BUAState, BUAUpdate } from '../types';
import { getConfigurationWithDefaults } from '../types';
import { getAvailableActions } from '../tools';
import { SYSTEM_PROMPT_TEMPLATE } from '../prompt';
import { getToolCalls, type BrowserToolCall } from '../utils';
import { BrowserManager, browserContainer } from 'pag-browser';
import { RunnableLambda } from '@langchain/core/runnables';

const _sysMessageToPrompt = (sysMessage: string | SystemMessage | undefined) => {
	if (typeof sysMessage === 'string') {
		return sysMessage;
	}
	return sysMessage?.content;
};

async function pruneMessages(messages: AIMessage[]): Promise<AIMessage[]> {
	const prunedMessages: AIMessage[] = [];
	// let foundFirstGetAxTree = false;
	let foundFirstExtractContent = false;

	for (let i = messages.length - 1; i >= 0; i--) {
		const message = messages[i]!;

		if (message.name === 'get_content') {
			if (!foundFirstExtractContent) {
				prunedMessages.push(message);
				foundFirstExtractContent = true;
				continue;
			}
		}

		prunedMessages.push(message);
	}

	return prunedMessages.reverse();
}

const pruneMessagesRunnable = RunnableLambda.from(pruneMessages).withConfig({
	runName: 'prune-messages',
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
	const configuration = getConfigurationWithDefaults(config);
	const { messages, actions: performedActions, nSteps } = state;
	let currentState;

	const session = await browserContainer.get(BrowserManager).getOrCreateSession({
		sessionId: configuration.sessionId,
		browserProfile: configuration.browserProfile,
	});

	const excludeActions: string[] = [];
	if (session) {
		const browserStateSummary = await session.getStateSummary(true);
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

	const systemPrompt = await SYSTEM_PROMPT_TEMPLATE.format({
		current_state: currentState,
		prompt: _sysMessageToPrompt(configuration.prompt),
	});

	const modelWithTools = new ChatOpenAI({
		model: configuration.model,
		temperature: 0,
	}).bindTools(getAvailableActions(await session.getCurrentPage(), excludeActions), {
		parallel_tool_calls: true,
	});

	const response = await modelWithTools.invoke([
		new SystemMessage(systemPrompt),
		...(await pruneMessagesRunnable.invoke(messages)),
	]);
	const browserToolCalls = (getToolCalls(response) ?? []) as BrowserToolCall[];

	const result: BUAUpdate = {
		actions: browserToolCalls,
		messages: response,
		scripts: { [nSteps]: performedActions },
	};

	if (performedActions.length > 0) {
		const lastAiMessage: AIMessage | undefined = messages.findLast(
			(message) => message.getType() === 'ai',
		);
		if (lastAiMessage) {
			lastAiMessage.tool_calls = performedActions;
		}

		result.messages = lastAiMessage ? [lastAiMessage, response] : response;
	}

	return result;
}

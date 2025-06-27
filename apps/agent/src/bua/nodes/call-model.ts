import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import type { BrowserToolCall, BUAState, BUAUpdate } from '../state.js';
import { ensureConfiguration, PersonaConfiguration } from '../configuration.js';
import { getAvailableActions } from '../tools/index.js';
import { BROWSER_SYSTEM_PROMPT_TEMPLATE } from '../prompts.js';
import { getToolCalls, loadChatModel } from '../utils.js';
import { RunnableLambda } from '@langchain/core/runnables';
import { BrowserManager, browserContainer } from '../../browser/index.js';

const personaText = (persona?: PersonaConfiguration) =>
	`You are an AI Agent trained to simulate real user behavior to serve the purpose of evaluating user experience (UX). Your goal is to **step into the shoes of a specific user** (persona), read and understand the task to be performed (task), and then **select the appropriate action** using the defined tools.
Think like a real user with the persona described. Based on the current interface and the target headline, come up with the next action that makes the most sense.
` +
	(persona
		? `
### Persona:
Name: ${persona.name}
Description: ${persona.description}
Age Group: ${persona.ageGroup}
Digital Skill Level: ${persona.digitalSkillLevel}
Behavior Traits: ${persona.behaviorTraits?.join(', ') ?? 'Unknown'}
Preferences: ${JSON.stringify(persona.preferences ?? {})}
Language: ${persona.language} (this is the language of the persona, you should use this language to reason)
`.trim()
		: '');

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
	const { sessionId, browserProfile, includeAttributes, useVision, persona, model } =
		ensureConfiguration(config);
	const { messages, actions: performedActions, nSteps, streamUrl } = state;
	const prompt = messages.shift();

	let currentState;

	const session = await browserContainer
		.get(BrowserManager)
		.getOrCreateSession(sessionId, { browserProfile });

	const excludeActions: string[] = [];
	if (session && streamUrl) {
		const browserStateSummary = await session.getStateSummary(true);
		let elementTreeText =
			browserStateSummary.elementTree.clickableElementsToString(includeAttributes);

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

		if (useVision && browserStateSummary.screenshot) {
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

	const systemPrompt = await BROWSER_SYSTEM_PROMPT_TEMPLATE.format({
		state: currentState,
		task: prompt,
		persona: personaText(persona),
	});

	const modelWithTools = (await loadChatModel(model)).bindTools(
		getAvailableActions(await session.getCurrentPage(), excludeActions),
		{
			parallel_tool_calls: true,
		},
	);

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

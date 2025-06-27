import type { AIMessageChunk } from '@langchain/core/messages';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatPromptTemplate, HumanMessagePromptTemplate } from '@langchain/core/prompts';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { LangGraphRunnableConfig } from '@langchain/langgraph';
import { z } from 'zod';
import { BUAState, BUAUpdate } from '../state.js';
import { loadChatModel } from '../utils.js';
import { ensureConfiguration } from '../configuration.js';

const validatorPrompt = new SystemMessage(
	`You are a UX testing task validator. You need to analyze the user's prompt and determine
if they're actually trying to request a valid UX testing or user experience evaluation task.

A valid UX testing task should:
- Test user interactions or user flows on a website or application
- Evaluate usability, accessibility, or user experience aspects
- Simulate user behavior or persona-based testing scenarios
- Test specific UI components, navigation patterns, or conversion flows
- Assess user journey completion or friction points

Examples of VALID UX testing tasks:
- "Test the checkout flow on an e-commerce website to identify usability issues"
- "Simulate a new user signing up for an account and evaluate the onboarding experience"
- "Test the navigation and search functionality on a news website"
- "Evaluate the accessibility of a form submission process"
- "Test the mobile responsiveness and user experience on a restaurant website"
- "Simulate user behavior for booking a flight and identify pain points"

Examples of INVALID UX testing tasks:
- "What's the weather like today?"
- "Tell me a joke"
- "What is UX testing?"
- "Help me fix my computer"
- "What time is it?"
- "Write code for my website"
- "Create a database schema"


Analyze the prompt and determine if it's a valid UX testing task. Respond with just true or false.`,
);

const validatorSchema = z.object({
	isSimulatedPrompt: z.boolean(),
});

const validatorTool = new DynamicStructuredTool({
	name: 'validate_prompt',
	description: 'Validate if the user prompt is a valid simulated prompt',
	schema: validatorSchema,
	func: async ({ isSimulatedPrompt }) => {
		return { isSimulatedPrompt };
	},
});

const humanTemplate = `
<user_prompt>
	{prompt}
</user_prompt>
`;

const chatPrompt = ChatPromptTemplate.fromMessages([
	validatorPrompt,
	HumanMessagePromptTemplate.fromTemplate(humanTemplate),
]);

export async function validator(
	state: BUAState,
	config: LangGraphRunnableConfig,
): Promise<BUAUpdate> {
	const { messages, isSimulatedPrompt } = state;
	if (isSimulatedPrompt) {
		return {
			isSimulatedPrompt,
		};
	}

	const { model } = ensureConfiguration(config);

	const firstMessage = messages[0];
	if (!(firstMessage instanceof HumanMessage)) {
		return {
			messages: [new AIMessage({ content: 'The task is not a valid simulated task' })],
			isSimulatedPrompt: false,
		};
	}

	const llm = await loadChatModel(model);

	return chatPrompt
		.pipe(
			llm.bindTools([validatorTool], {
				tool_choice: validatorTool.name,
			}),
		)
		.pipe((x: AIMessageChunk) => {
			const toolCall = x.tool_calls?.[0];
			return toolCall?.args as z.infer<typeof validatorTool.schema>;
		})
		.invoke({ prompt: firstMessage.content });
}

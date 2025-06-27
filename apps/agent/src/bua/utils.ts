import type { AIMessage } from '@langchain/core/messages';
import type { ToolCall } from '@langchain/core/messages/tool';
import { initChatModel } from 'langchain/chat_models/universal';

/**
 * Load a chat model from a fully specified name.
 * @param fullySpecifiedName - String in the format 'provider/model' or 'provider/account/provider/model'.
 * @returns A Promise that resolves to a BaseChatModel instance.
 */
export async function loadChatModel(fullySpecifiedName: string) {
	const index = fullySpecifiedName.indexOf('/');
	if (index === -1) {
		// If there's no "/", assume it's just the model
		return await initChatModel(fullySpecifiedName);
	} else {
		const provider = fullySpecifiedName.slice(0, index);
		const model = fullySpecifiedName.slice(index + 1);
		return await initChatModel(model, { modelProvider: provider });
	}
}

/**
 * Gets the tool outputs from an AIMessage.
 *
 * @param {AIMessage} message The message to get tool outputs from.
 * @returns {ToolCall[] | undefined} The tool outputs from the message, or undefined if there are none.
 */
export function getToolCalls(message: AIMessage): ToolCall[] | undefined {
	const toolCalls = message.tool_calls;

	if (!toolCalls || !toolCalls.length) {
		return undefined;
	}

	return toolCalls;
}

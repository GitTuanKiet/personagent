import type { AIMessage, BaseMessage, ToolMessage } from '@langchain/core/messages';
import type { ToolCall } from '@langchain/core/messages/tool';
import { BROWSER_TOOL_CALLS } from './tools';

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

/**
 * Checks if a message is a browser call tool message.
 *
 * @param {BaseMessage} message The message to check.
 * @returns {boolean} True if the message is a browser call tool message, false otherwise.
 */
export function isBrowserCallToolMessage(message: BaseMessage): message is ToolMessage {
	return (
		message.getType() === 'tool' &&
		'type' in message.additional_kwargs &&
		message.additional_kwargs.type === 'browser_call_output'
	);
}

export type BrowserToolCall = Omit<ToolCall, 'name'> & {
	name: (typeof BROWSER_TOOL_CALLS)[number];
};

/**
 * Checks if a tool call is a browser tool call.
 *
 * @param {ToolCall} call The tool call to check.
 * @returns {boolean} True if the tool call is a browser tool call, false otherwise.
 */
export function isBrowserToolCall(call: ToolCall): call is BrowserToolCall {
	return BROWSER_TOOL_CALLS.includes(call.name as (typeof BROWSER_TOOL_CALLS)[number]);
}

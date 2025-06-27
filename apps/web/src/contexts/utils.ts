import { AIMessage, BaseMessage, BaseMessageChunk } from '@langchain/core/messages';

export function removeCodeBlockFormatting(text: string): string {
	if (!text) return text;
	// Regular expression to match code blocks
	const codeBlockRegex = /^```[\w-]*\n([\s\S]*?)\n```$/;

	// Check if the text matches the code block pattern
	const match = text.match(codeBlockRegex);

	if (match) {
		// If it matches, return the content inside the code block
		return match[1].trim();
	} else {
		// If it doesn't match, return the original text
		return text;
	}
}

export const replaceOrInsertMessageChunk = (
	prevMessages: BaseMessage[],
	newMessageChunk: BaseMessageChunk,
): BaseMessage[] => {
	const existingMessageIndex = prevMessages.findIndex((msg) => msg.id === newMessageChunk.id);

	if (
		prevMessages[existingMessageIndex]?.content &&
		typeof prevMessages[existingMessageIndex]?.content !== 'string'
	) {
		throw new Error('Message content is not a string');
	}
	if (typeof newMessageChunk.content !== 'string') {
		throw new Error('Message chunk content is not a string');
	}

	if (existingMessageIndex !== -1) {
		// Create a new array with the updated message
		return [
			...prevMessages.slice(0, existingMessageIndex),
			new AIMessage({
				...prevMessages[existingMessageIndex],
				content:
					(prevMessages[existingMessageIndex]?.content || '') + (newMessageChunk?.content || ''),
			}),
			...prevMessages.slice(existingMessageIndex + 1),
		];
	} else {
		const newMessage = new AIMessage({
			...newMessageChunk,
		});
		return [...prevMessages, newMessage];
	}
};

import React, { useRef, useEffect, memo, useState } from 'react';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import {
	MessageCircleIcon,
	Copy,
	CopyCheck,
	ChevronDown,
	ChevronUp,
	Activity,
	Loader2,
	User,
	Bot,
	Settings,
	Code,
} from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@workspace/ui/components/accordion';
import { Avatar, AvatarFallback } from '@workspace/ui/components/avatar';
import type { ToolMessage } from './types';
import type {
	BaseMessage,
	AIMessage,
	HumanMessage,
	MessageContent,
} from '@langchain/core/messages';

// Action icons mapping
const ACTION_ICONS: Record<string, React.ReactNode> = {
	click_element_by_index: '👆',
	done: '✅',
	drag_drop: '🖱️',
	dropdown_options: '📋',
	execute_javascript: '⚡',
	get_content: '📄',
	input_text: '⌨️',
	navigate_or_back: '🧭',
	scroll: '📜',
	send_keys: '🔤',
	tab_manager: '🗂️',
	wait: '⏳',
	thinking: <Loader2 className="h-3 w-3 animate-spin" />,
};

// Format content like messenger - rich display
const formatContent = (content: MessageContent): React.ReactNode => {
	if (typeof content === 'string') {
		return <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">{content}</div>;
	}

	if (typeof content === 'object' && content !== null) {
		if (Array.isArray(content)) {
			return (
				<div className="space-y-2">
					{content.map((item, index) => (
						<div key={index} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
							{typeof item === 'string' ? (
								<div className="text-slate-700 text-sm">{item}</div>
							) : (
								<div className="space-y-1">
									{Object.entries(item).map(([k, v]) => (
										<div key={k} className="flex gap-2">
											<span className="text-slate-600 text-xs font-medium min-w-0 flex-shrink-0">
												{k}:
											</span>
											<span className="text-slate-800 text-xs">{String(v)}</span>
										</div>
									))}
								</div>
							)}
						</div>
					))}
				</div>
			);
		}

		// Object case - messenger-style structured view
		return (
			<div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
				<div className="flex items-center gap-2 mb-3">
					<Code className="h-4 w-4 text-slate-500" />
					<span className="text-xs font-medium text-slate-600">Data Object</span>
				</div>
				<div className="space-y-2">
					{Object.entries(content).map(([key, value]) => (
						<div key={key} className="flex gap-3">
							<span className="text-slate-600 text-sm font-medium min-w-0 flex-shrink-0">
								{key}:
							</span>
							<div className="flex-1">
								{typeof value === 'string' ||
								typeof value === 'number' ||
								typeof value === 'boolean' ? (
									<span className="text-slate-800 text-sm">{String(value)}</span>
								) : (
									<span className="text-slate-500 text-sm italic">[{typeof value}]</span>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	return <div className="text-slate-700">{String(content)}</div>;
};

// Tool Call Group (AI message + tool results) - Clean design
interface ToolCallGroup {
	aiMessage: AIMessage;
	toolResults: ToolMessage[];
}

const ToolCallAccordion: React.FC<{ group: ToolCallGroup }> = memo(({ group }) => {
	const { aiMessage, toolResults } = group;
	const [copiedActions, setCopiedActions] = useState<Set<number>>(new Set());

	const handleCopyAction = async (index: number, content: string) => {
		try {
			await navigator.clipboard.writeText(content);
			const newCopied = new Set(copiedActions);
			newCopied.add(index);
			setCopiedActions(newCopied);
			setTimeout(() => {
				setCopiedActions((prev) => {
					const updated = new Set(prev);
					updated.delete(index);
					return updated;
				});
			}, 2000);
		} catch (err) {
			console.error('Failed to copy text:', err);
		}
	};

	const getActionIcon = (actionName: string) => {
		return ACTION_ICONS[actionName] || <Activity className="h-3 w-3" />;
	};

	// Get tool calls from AI message
	const toolCalls = (aiMessage as any).tool_calls || [];
	const hasErrors = toolResults.some((tool) => tool.status === 'error');

	return (
		<div className="group relative flex items-start gap-3 mb-6">
			{/* AI Avatar - Updated colors */}
			<Avatar className="w-7 h-7 mt-1 border-2 border-indigo-100 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm">
				<AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
					<Bot size={14} />
				</AvatarFallback>
			</Avatar>

			{/* Tool Call Accordion - Refined design */}
			<div className="flex-1">
				<Accordion type="single" collapsible className="w-full" defaultValue="tools">
					<AccordionItem
						value="tools"
						className="border border-slate-200 rounded-xl bg-white shadow-sm"
					>
						<AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50 rounded-t-xl">
							<div className="flex items-center gap-3 w-full text-left">
								<div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100">
									<Settings className="h-4 w-4 text-indigo-600" />
								</div>
								<div className="flex-1 min-w-0">
									<div className="text-sm font-semibold text-slate-800">
										Used {toolCalls.length} tool{toolCalls.length !== 1 ? 's' : ''}
									</div>
									<div className="text-xs text-slate-500 truncate">
										{toolCalls.map((call: any) => call.function?.name || call.name).join(', ')}
									</div>
								</div>
								<div className="flex items-center gap-2 flex-shrink-0">
									{hasErrors && (
										<Badge variant="destructive" className="text-xs">
											Error
										</Badge>
									)}
									<Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700">
										{toolResults.length} results
									</Badge>
								</div>
							</div>
						</AccordionTrigger>
						<AccordionContent className="px-4 pb-4">
							<div className="space-y-3">
								{toolResults.map((toolMessage, index) => {
									const actionName = toolMessage.name || 'unknown_action';
									const isError = toolMessage.status === 'error';
									const isCopied = copiedActions.has(index);

									return (
										<div
											key={index}
											className="border border-slate-100 rounded-lg p-3 bg-slate-50/50 hover:bg-slate-50 transition-colors"
										>
											<div className="flex items-center gap-3 mb-3">
												<div
													className={`flex items-center justify-center w-6 h-6 rounded-full ${
														isError ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
													}`}
												>
													{getActionIcon(actionName)}
												</div>
												<span className="text-sm font-medium text-slate-800 flex-1">
													{actionName.replace(/_/g, ' ')}
												</span>
												{isError && (
													<Badge variant="destructive" className="text-xs">
														Failed
													</Badge>
												)}
												<Button
													variant="ghost"
													size="sm"
													className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-200"
													onClick={() => handleCopyAction(index, String(toolMessage.content))}
												>
													{isCopied ? <CopyCheck size={12} /> : <Copy size={12} />}
												</Button>
											</div>

											{toolMessage.content && (
												<div className="pl-2">{formatContent(toolMessage.content)}</div>
											)}
										</div>
									);
								})}
							</div>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</div>
		</div>
	);
});

// UserMessageBubble Component - Refined design
const UserMessageBubble: React.FC<{ message: HumanMessage }> = memo(({ message }) => {
	return (
		<div className="group relative flex items-start gap-3 mb-6">
			<div className="flex-1"></div>
			<div className="max-w-2xl">
				<div className="bg-indigo-600 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-sm">
					<div className="text-sm leading-relaxed">{formatContent(message.content)}</div>
				</div>
			</div>
			<Avatar className="w-7 h-7 mt-1 border-2 border-indigo-100 bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
				<AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
					<User size={14} />
				</AvatarFallback>
			</Avatar>
		</div>
	);
});

// AiMessageBubble Component - Clean design
const AiMessageBubble: React.FC<{ aiMessage: AIMessage }> = memo(({ aiMessage }) => {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(String(aiMessage.content));
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error('Failed to copy text:', err);
		}
	};

	return (
		<div className="group relative flex items-start gap-3 mb-6">
			{/* AI Avatar */}
			<Avatar className="w-7 h-7 mt-1 border-2 border-indigo-100 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm">
				<AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
					<Bot size={14} />
				</AvatarFallback>
			</Avatar>

			{/* Message Content */}
			<div className="flex-1 max-w-none">
				<div className="bg-white border border-slate-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
					{formatContent(aiMessage.content)}
				</div>

				{/* Copy button - appears on hover */}
				<div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2">
					<Button
						variant="ghost"
						size="sm"
						className="h-7 px-2 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
						onClick={handleCopy}
					>
						{copied ? (
							<>
								<CopyCheck size={12} className="mr-1.5" />
								Copied!
							</>
						) : (
							<>
								<Copy size={12} className="mr-1.5" />
								Copy
							</>
						)}
					</Button>
				</div>
			</div>
		</div>
	);
});

// MessageList Component - Cursor style grouping
const MessageList: React.FC<{ messages: BaseMessage[] }> = memo(({ messages }) => {
	// Group messages Cursor-style: AI with tool_calls + following tool results
	const groupedMessages: (BaseMessage | ToolCallGroup)[] = [];

	for (let i = 0; i < messages.length; i++) {
		const message = messages[i];

		// Check if this is an AI message with tool_calls
		if (message.getType() === 'ai') {
			const aiMessage = message as AIMessage;
			const toolCalls = (aiMessage as any).tool_calls || [];

			if (toolCalls.length > 0) {
				// This AI message has tool calls, collect following tool results
				const toolResults: ToolMessage[] = [];
				let j = i + 1;

				// Collect consecutive tool messages
				while (j < messages.length && messages[j].getType() === 'tool') {
					toolResults.push(messages[j] as ToolMessage);
					j++;
				}

				// Create tool call group
				groupedMessages.push({
					aiMessage,
					toolResults,
				});

				// Skip the tool messages we just processed
				i = j - 1;
			} else {
				// Regular AI message without tool calls
				groupedMessages.push(message);
			}
		} else {
			// Non-AI message (human, etc.)
			groupedMessages.push(message);
		}
	}

	return (
		<div className="space-y-2">
			{groupedMessages.map((item, index) => {
				if ('aiMessage' in item) {
					// This is a ToolCallGroup
					return <ToolCallAccordion key={`toolcall-${index}`} group={item} />;
				} else {
					// This is a single message
					const messageType = item.getType();

					if (messageType === 'human') {
						return <UserMessageBubble key={item.id || index} message={item as HumanMessage} />;
					}

					if (messageType === 'ai') {
						return <AiMessageBubble key={item.id || index} aiMessage={item as AIMessage} />;
					}

					// Fallback for unknown message types
					return (
						<div key={item.id || index} className="flex items-start gap-3 mb-6">
							<Avatar className="w-7 h-7 mt-1 border-2 border-slate-200 bg-slate-200 shadow-sm">
								<AvatarFallback className="bg-slate-400 text-white">?</AvatarFallback>
							</Avatar>
							<div className="flex-1">
								<div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
									<div className="text-sm text-slate-600 mb-2 font-medium">
										Unknown message type: {messageType}
									</div>
									{formatContent(item.content)}
								</div>
							</div>
						</div>
					);
				}
			})}
		</div>
	);
});

// Main MessagesSection Component
interface MessagesSectionProps {
	messages: BaseMessage[];
	hasSimulation: boolean;
}

export const MessagesSection: React.FC<MessagesSectionProps> = ({ messages, hasSimulation }) => {
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Auto scroll to bottom when new messages arrive
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	return (
		<div className="flex-1 h-full bg-slate-50">
			<ScrollArea className="h-full w-full">
				<div className="max-w-4xl mx-auto px-6 py-8">
					{messages.length === 0 && !hasSimulation ? (
						<div className="flex flex-col items-center justify-center h-96 text-center">
							<div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-6 shadow-sm">
								<MessageCircleIcon size={36} className="text-indigo-600" />
							</div>
							<h3 className="text-xl font-semibold text-slate-800 mb-3">Ready to start</h3>
							<p className="text-slate-600 max-w-md leading-relaxed">
								Create a new simulation to see AI agent interactions in real-time. Your conversation
								will appear here as the agent works.
							</p>
						</div>
					) : (
						<MessageList messages={messages} />
					)}
					<div ref={messagesEndRef} />
				</div>
			</ScrollArea>
		</div>
	);
};

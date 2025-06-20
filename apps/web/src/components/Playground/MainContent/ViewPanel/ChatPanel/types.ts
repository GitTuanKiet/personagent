import type { ToolMessage as LangChainToolMessage } from '@langchain/core/messages';
import type { BrowserTool } from '@pag/langgraph-bua';

export interface ToolMessage extends Omit<LangChainToolMessage, 'name' | 'status'> {
	name: BrowserTool;
	status: 'success' | 'error';
}

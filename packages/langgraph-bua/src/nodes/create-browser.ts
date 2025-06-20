import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import type { BUAState, BUAUpdate } from '../types';
import { getConfigurationWithDefaults } from '../types';
import { BrowserManager, browserContainer } from 'pag-browser';

export async function createBrowser(
	state: BUAState,
	config: LangGraphRunnableConfig,
): Promise<BUAUpdate> {
	const { browserPid } = state;
	if (browserPid) return {};

	const { sessionId, browserProfile } = getConfigurationWithDefaults(config);

	const browserManager = browserContainer.get(BrowserManager);
	const session = await browserManager.getOrCreateSession({ sessionId, browserProfile });

	return {
		browserPid: session.browserPid,
	};
}

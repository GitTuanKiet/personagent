import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import type { BUAState, BUAUpdate } from '../state.js';
import { ensureConfiguration } from '../configuration.js';
import { BrowserManager, browserContainer } from '../../browser/index.js';

export async function createBrowser(
	state: BUAState,
	config: LangGraphRunnableConfig,
): Promise<BUAUpdate> {
	if (state.streamUrl) return {};

	const { sessionId, browserProfile } = ensureConfiguration(config);

	const browserManager = browserContainer.get(BrowserManager);
	browserManager.createSession(sessionId, { browserProfile });

	return {
		streamUrl: browserManager.createStreamUrl(sessionId),
	};
}

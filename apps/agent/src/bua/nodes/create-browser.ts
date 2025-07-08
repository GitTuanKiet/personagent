import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import type { BUAState, BUAUpdate } from '../state.js';
import { ensureConfiguration } from '../configuration.js';
import { BrowserManager, browserContainer } from '../../browser/index.js';

export async function createBrowser(
	state: BUAState,
	config: LangGraphRunnableConfig,
): Promise<BUAUpdate> {
	if (state.streamUrl) return { streamUrl: state.streamUrl };

	const { sessionId, browserProfile, url } = ensureConfiguration(config);

	const browserManager = browserContainer.get(BrowserManager);
	browserManager.createSession(sessionId, { browserProfile });
	if (url) {
		const session = await browserManager.getSession(sessionId);
		const currentPage = await session?.getCurrentPage();
		if (currentPage?.url() !== url) {
			await currentPage?.goto(url);
		}
	}

	return {
		streamUrl: browserManager.createStreamUrl(sessionId),
	};
}

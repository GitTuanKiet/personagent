import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import type { BUAState, BUAUpdate } from '../types';
import { getConfigurationWithDefaults } from '../types';
import { BrowserAction, browserContainer } from '../browser';
import { v4 as uuidv4 } from 'uuid';

export async function createBrowser(
	state: BUAState,
	config: LangGraphRunnableConfig,
): Promise<BUAUpdate> {
	const { sessionId } = state;
	if (sessionId) return {};

	const browserAction = browserContainer.get(BrowserAction);
	const { browserProfile: profile, wssUrl, cdpUrl } = getConfigurationWithDefaults(config);

	browserAction.browserProfile.setProfile({ ...profile });
	browserAction.session.setConnection({ wssUrl, cdpUrl });

	await browserAction.session.start();

	return {
		sessionId: browserAction.session.browserPid?.toString() || uuidv4(),
	};
}

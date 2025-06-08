import { z } from 'zod';
import { tool } from '@langchain/core/tools';
import type { ActionManager } from '../browser';

export const createNavigateTool = (manager: ActionManager) => {
	return tool(
		async (input) => {
			const { action, url, page_id } = input;

			let result = '';
			switch (action) {
				case 'go_to_url':
					if (!url) throw new Error('url is required for go_to_url');
					result = await manager.goToUrl({ url });
					break;
				case 'go_back':
					result = await manager.goBack({});
					break;
				case 'open_tab':
					if (!url) throw new Error('url is required for open_tab');
					result = await manager.openTab({ url });
					break;
				case 'close_tab':
					if (!page_id) throw new Error('page_id is required for close_tab');
					result = await manager.closeTab({ page_id });
					break;
				case 'switch_tab':
					if (!page_id) throw new Error('page_id is required for switch_tab');
					result = await manager.switchTab({ page_id });
					break;
				default:
					throw new Error(`Invalid action: ${action}`);
			}
			return `✅ Navigate: ${result}`;
		},
		{
			name: 'navigate',
			description: 'Perform navigation actions like opening URLs, switching tabs, or going back.',
			schema: z.object({
				action: z
					.enum(['go_to_url', 'go_back', 'open_tab', 'close_tab', 'switch_tab'])
					.describe(`The type of navigation to perform. Required parameters per command:
- go_to_url: required url
- go_back: no required parameters
- open_tab: required url
- close_tab: required page_id
- switch_tab: required page_id`),

				url: z.string().optional().describe('The URL to navigate to or open in a new tab.'),
				page_id: z.number().optional().describe('The tab/page ID to switch to or close.'),
			}),
		},
	);
};

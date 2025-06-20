import type { Page } from 'patchright';
import {
	clickElementByIndexAction,
	doneAction,
	dragDropAction,
	dropdownOptionsAction,
	executeJavascriptAction,
	getContentAction,
	inputTextAction,
	navigateOrBackAction,
	scrollAction,
	sendKeysAction,
	tabManagerAction,
	waitAction,
} from './actions';
import { thinkingAction } from './thinking';

export const BROWSER_TOOLS = {
	click_element_by_index: clickElementByIndexAction,
	done: doneAction,
	drag_drop: dragDropAction,
	dropdown_options: dropdownOptionsAction,
	execute_javascript: executeJavascriptAction,
	get_content: getContentAction,
	input_text: inputTextAction,
	navigate_or_back: navigateOrBackAction,
	scroll: scrollAction,
	send_keys: sendKeysAction,
	tab_manager: tabManagerAction,
	wait: waitAction,
	thinking: thinkingAction,
};
export const BROWSER_TOOL_CALLS = Object.keys(BROWSER_TOOLS) as (keyof typeof BROWSER_TOOLS)[];
export type BrowserTool = (typeof BROWSER_TOOL_CALLS)[number];

export function getAvailableActions(page?: Page, excludeActions: string[] = []) {
	if (!page) {
		return Object.values(BROWSER_TOOLS);
	}

	return Object.values(BROWSER_TOOLS).filter((action) => {
		if (excludeActions.includes(action.name)) {
			return false;
		}
		return action.pageMatcher?.(page) ?? true;
	});
}

export * from './base';

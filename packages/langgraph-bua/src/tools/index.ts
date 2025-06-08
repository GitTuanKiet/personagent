import type { Page } from 'playwright';
import {
	doneAction,
	waitAction,
	searchGoogleAction,
	goToUrlAction,
	goBackAction,
	clickElementByIndexAction,
	inputTextAction,
	savePdfAction,
	switchTabAction,
	openTabAction,
	closeTabAction,
	extractContentAction,
	getAxTreeAction,
	scrollDownAction,
	scrollUpAction,
	sendKeysAction,
	scrollToTextAction,
	getDropdownOptionsAction,
	selectDropdownOptionAction,
	dragDropAction,
} from './actions';
import { thinkingAction } from './thinking';

export const BROWSER_TOOLS = {
	done: doneAction,
	// 'wait': waitAction,
	// 'search_google': searchGoogleAction,
	go_to_url: goToUrlAction,
	go_back: goBackAction,
	click_element_by_index: clickElementByIndexAction,
	input_text: inputTextAction,
	// 'save_pdf': savePdfAction,
	switch_tab: switchTabAction,
	open_tab: openTabAction,
	close_tab: closeTabAction,
	extract_content: extractContentAction,
	// 'get_ax_tree': getAxTreeAction,
	scroll_down: scrollDownAction,
	scroll_up: scrollUpAction,
	// 'send_keys': sendKeysAction,
	// 'scroll_to_text': scrollToTextAction,
	// 'get_dropdown_options': getDropdownOptionsAction,
	select_dropdown_option: selectDropdownOptionAction,
	drag_drop: dragDropAction,
	thinking: thinkingAction,
};
export const BROWSER_TOOL_CALLS = Object.keys(BROWSER_TOOLS) as (keyof typeof BROWSER_TOOLS)[];

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

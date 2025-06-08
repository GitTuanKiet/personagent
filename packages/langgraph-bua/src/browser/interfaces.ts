import type { DOMHistoryElement, SelectorMap } from './dom';
import { DOMElementNode, DOMState } from './dom';

export interface CachedClickableElementHashes {
	url: string;
	hashes: Set<string>;
}

/**
 * Represents information about a browser tab
 */
export interface TabInfo {
	pageId: number;
	url: string;
	title: string;
	/**
	 * Parent page that contains this popup or cross - origin iframe
	 */
	parentPageId?: string;
}

/**
 * Represents the summary of the browser's current state designed for an LLM to process
 */
export class BrowserStateSummary extends DOMState {
	url: string;
	title: string;
	tabs: TabInfo[];
	screenshot?: string;
	pixelsAbove: number;
	pixelsBelow: number;
	browserErrors?: string[];

	constructor({
		url,
		title,
		tabs,
		screenshot,
		pixelsAbove,
		pixelsBelow,
		browserErrors,
		...domState
	}: {
		url: string;
		title: string;
		tabs: TabInfo[];
		screenshot?: string;
		pixelsAbove: number;
		pixelsBelow: number;
		browserErrors?: string[];
		elementTree: DOMElementNode;
		selectorMap: SelectorMap;
	}) {
		super(domState);
		this.url = url;
		this.title = title;
		this.tabs = tabs;
		this.screenshot = screenshot;
		this.pixelsAbove = pixelsAbove;
		this.pixelsBelow = pixelsBelow;
		this.browserErrors = browserErrors;
	}
}

export interface BrowserStateHistory {
	url: string;
	title: string;
	tabs: TabInfo[];
	interactedElement: (DOMHistoryElement | null)[];
	screenshot?: string;
}

export class BrowserError extends Error {}

export class URLNotAllowedError extends BrowserError {
	constructor(message: string) {
		super(message);
	}
}

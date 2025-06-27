import type {
	LaunchOptions,
	Geolocation,
	ViewportSize,
	BrowserContextOptions,
	ConnectOptions,
	ConnectOverCDPOptions,
	HTTPCredentials,
	Browser,
	BrowserContext,
	Page,
	ElementHandle,
} from 'patchright';
import type { DOMHistoryElement, SelectorMap } from '../dom/index.js';
import { DOMElementNode, DOMState } from '../dom/views.js';

export interface LaunchPersistentContextOptions extends LaunchOptions {
	acceptDownloads?: boolean;
	baseURL?: string;
	bypassCSP?: boolean;
	clientCertificates?: BrowserContextOptions['clientCertificates'];
	colorScheme?: null | 'light' | 'dark' | 'no-preference';
	contrast?: null | 'no-preference' | 'more';
	deviceScaleFactor?: number;
	extraHTTPHeaders?: { [key: string]: string };
	forcedColors?: null | 'active' | 'none';
	geolocation?: Geolocation;
	hasTouch?: boolean;
	httpCredentials?: HTTPCredentials;
	ignoreHTTPSErrors?: boolean;
	isMobile?: boolean;
	javaScriptEnabled?: boolean;
	locale?: string;
	offline?: boolean;
	permissions?: Array<string>;
	recordHar?: {
		omitContent?: boolean;
		content?: 'omit' | 'embed' | 'attach';
		path: string;
		mode?: 'full' | 'minimal';
		urlFilter?: string | RegExp;
	};
	recordVideo?: {
		dir: string;
		size?: ViewportSize;
	};
	reducedMotion?: null | 'reduce' | 'no-preference';
	screen?: ViewportSize;
	serviceWorkers?: 'allow' | 'block';
	strictSelectors?: boolean;
	timezoneId?: string;
	userAgent?: string;
	viewport?: null | ViewportSize;
}

export interface IBrowserProfile
	extends ConnectOptions,
		ConnectOverCDPOptions,
		LaunchOptions,
		BrowserContextOptions,
		LaunchPersistentContextOptions {
	userDataDir?: string;
	profileDirectory?: string;
	stealth?: boolean;
	disableSecurity?: boolean;
	deterministicRendering?: boolean;
	blockedDomains?: string[];
	allowedDomains?: string[];
	keepAlive?: boolean;
	windowSize?: ViewportSize;
	windowPosition?: ViewportSize;
	minimumWaitPageLoadTime?: number;
	waitForNetworkIdlePageLoadTime?: number;
	maximumWaitPageLoadTime?: number;
	includeDynamicAttributes?: boolean;
	highlightElements?: boolean;
	viewportExpansion?: number;
	defaultTimeout?: number;
	defaultNavigationTimeout?: number;

	wssUrl?: string;
	cdpUrl?: string;
}

export interface IBrowserSession {
	browserProfile: IBrowserProfile;
	browser?: Browser | null;
	browserContext?: BrowserContext;
	initialized: boolean;
	agentCurrentPage?: Page;
	humanCurrentPage?: Page;

	start(): Promise<void>;
	stop(): Promise<void>;
	isConnected(): boolean;
	saveStorageState(path?: string): Promise<void>;
	loadStorageState(path?: string): Promise<void>;
	newContext(options?: BrowserContextOptions): Promise<this>;

	// Actions
	getCurrentPage(): Promise<Page>;
	getTabsInfo(): Promise<TabInfo[]>;
	closeTab(tabIndex?: number): Promise<void>;
	navigate(url: string): Promise<void>;
	refresh(): Promise<void>;
	executeJavascript<T>(script: string): Promise<T>;
	takeScreenshot(fullPage?: boolean): Promise<string>;
	getDomElementByIndex(index: number): Promise<DOMElementNode | undefined>;
	getElementByIndex(index: number): Promise<ElementHandle | null>;
	findFileUploadElementByIndex(index: number): Promise<DOMElementNode | undefined>;
	getScrollInfo(page: Page): Promise<[number, number]>;
	scrollContainer(pixels: number): Promise<void>;
	getStateSummary(cacheClickableElementsHashes?: boolean): Promise<BrowserStateSummary>;
	clickElementNode(elementNode: DOMElementNode): Promise<string | undefined>;
	inputTextElementNode(elementNode: DOMElementNode, text: string): Promise<void>;
	switchToTab(pageId: number): Promise<Page>;
	createNewTab(url?: string): Promise<Page>;
	getSelectorMap(): Promise<SelectorMap>;
	getElementByIndex(index: number): Promise<ElementHandle | null>;
	findFileUploadElementByIndex(index: number): Promise<DOMElementNode | undefined>;
	getScrollInfo(page: Page): Promise<[number, number]>;
	scrollContainer(pixels: number): Promise<void>;
}

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

import assert from 'node:assert';
import { minimatch } from 'minimatch';
import type {
	Page,
	ElementHandle,
	Browser,
	BrowserContext,
	FrameLocator,
	Request,
	Response,
} from 'playwright';
import { DomService } from './dom/service';
import { ClickableElementProcessor } from './dom/clickable_element_processor/service';
import { BrowserSession } from './session';
import type { BrowserProfile } from './profile';
import type { CachedClickableElementHashes, TabInfo } from './interfaces';
import { BrowserError, BrowserStateSummary, URLNotAllowedError } from './interfaces';
import {
	enhancedCssSelectorForElement,
	getUniqueFilename,
	sleep,
	timeExecutionAsync,
} from './utils';
import { DOMBaseNode, DOMElementNode, type SelectorMap } from './dom';
import { SMART_SCROLL_JS, PAGE_STRUCTURE_JS } from './consts';
import { singleton } from './di';

let _GLOB_WARNING_SHOWN = false;

function requireInitialization(
	_target: object,
	_propertyKey: string | symbol,
	propertyDescriptor: PropertyDescriptor,
) {
	const originalMethod = propertyDescriptor.value as Function;

	propertyDescriptor.value = async function (this: BrowserAction, ...args: any[]) {
		if (!this.session.initialized) {
			await this.session.start();
		}
		if (!this.agentCurrentPage) {
			this.agentCurrentPage = this.browserContext.pages()[0];
		}
		if (!this.agentCurrentPage) {
			await this.createNewTab();
			assert(this.agentCurrentPage);
		}

		return originalMethod.apply(this, args);
	};

	return propertyDescriptor;
}

@singleton()
export class BrowserAction {
	private _cachedClickableElementHashes?: CachedClickableElementHashes;
	browserStateSummary?: BrowserStateSummary;

	constructor(
		private browserSession: BrowserSession,
		private domService: DomService,
		private clickableElementProcessor: ClickableElementProcessor,
	) {}

	get session(): BrowserSession {
		return this.browserSession;
	}

	// #region - Properties
	get browserProfile(): BrowserProfile {
		return this.browserSession.browserProfile;
	}

	get browserContext(): BrowserContext {
		assert(
			this.browserSession.browserContext,
			new BrowserError('browserSession is not initialized'),
		);
		return this.browserSession.browserContext;
	}
	set browserContext(context: BrowserContext) {
		this.browserSession.browserContext = context;
	}

	get browser(): Browser {
		assert(this.browserSession.browser, new BrowserError('browserSession is not initialized'));
		return this.browserSession.browser;
	}
	set browser(browser: Browser) {
		this.browserSession.browser = browser;
	}

	get agentCurrentPage(): Page | undefined {
		if (!this.browserSession.agentCurrentPage || this.browserSession.agentCurrentPage.isClosed()) {
			this.browserSession.agentCurrentPage = undefined;
		}
		return this.browserSession.agentCurrentPage || this.browserSession.humanCurrentPage;
	}
	set agentCurrentPage(page: Page | undefined) {
		this.browserSession.agentCurrentPage = page;
	}

	get humanCurrentPage(): Page | undefined {
		if (!this.browserSession.humanCurrentPage || this.browserSession.humanCurrentPage.isClosed()) {
			this.browserSession.humanCurrentPage = undefined;
		}
		return this.browserSession.humanCurrentPage || this.browserSession.agentCurrentPage;
	}
	set humanCurrentPage(page: Page | undefined) {
		this.browserSession.humanCurrentPage = page;
	}
	// #endregion

	// #region Tab Management
	@requireInitialization
	async getCurrentPage(): Promise<Page> {
		if (!this.agentCurrentPage) {
			// if both are still None, fallback to using the first open tab we can find
			const pages = this.browserContext.pages();
			if (pages.length > 0) {
				const firstAvailableTab = pages[0];
				this.agentCurrentPage = firstAvailableTab;
				this.humanCurrentPage = firstAvailableTab;
			} else {
				// if all tabs are closed, open a new one
				const newTab = await this.createNewTab();
				this.agentCurrentPage = newTab;
				this.humanCurrentPage = newTab;
			}
		}

		assert(this.agentCurrentPage && this.humanCurrentPage, 'No available page found or created');

		return this.agentCurrentPage;
	}

	get tabs(): Page[] {
		try {
			return this.browserContext.pages();
		} catch (error) {
			return [];
		}
	}

	@requireInitialization
	async newTab(url?: string): Promise<Page> {
		return this.createNewTab(url);
	}

	@requireInitialization
	async switchTab(tabIndex: number): Promise<Page> {
		const pages = this.browserContext.pages();
		if (tabIndex < 0 || tabIndex >= pages.length) throw new BrowserError('Tab index out of range');
		this.agentCurrentPage = pages[tabIndex];
		return this.agentCurrentPage!;
	}

	@requireInitialization
	async waitForElement(selector: string, timeout: number = 10000): Promise<void> {
		const page = await this.getCurrentPage();
		await page.waitForSelector(selector, { state: 'visible', timeout });
	}

	@requireInitialization
	@timeExecutionAsync('--remove_highlights')
	async removeHighlights(): Promise<void> {
		const page = await this.getCurrentPage();
		try {
			await page.evaluate(
				new Function(
					'return ' +
						`
try {
    // Remove the highlight container and all its contents
    const container = document.getElementById('playwright-highlight-container');
    if (container) {
        container.remove();
    }

    // Remove highlight attributes from elements
    const highlightedElements = document.querySelectorAll('[browser-user-highlight-id^="playwright-highlight-"]');
    highlightedElements.forEach(el => {
        el.removeAttribute('browser-user-highlight-id');
    });
} catch (e) {
    console.error('Failed to remove highlights:', e);
}
`,
				)(),
			);
		} catch (e: any) {
			console.debug(
				`⚠  Failed to remove highlights (this is usually ok): ${e?.constructor?.name ?? typeof e}: ${e?.message ?? e}`,
			);
			// Don't throw, not critical
		}
	}

	@requireInitialization
	async getDomElementByIndex(index: number): Promise<DOMElementNode | undefined> {
		const selectorMap = await this.getSelectorMap();
		return selectorMap.get(index);
	}

	@requireInitialization
	@timeExecutionAsync('--get_tabs_info')
	async getTabsInfo(): Promise<TabInfo[]> {
		const tabInfos: TabInfo[] = [];

		for (const [pageId, page] of this.browserContext.pages().entries()) {
			let tabInfo: TabInfo;
			try {
				tabInfo = { pageId, url: page.url(), title: await page.title() };
			} catch (e) {
				console.debug(`⚠  Failed to get tab info for tab #${pageId}: ${page.url()} (ignoring)`);
				tabInfo = { pageId, url: 'about:blank', title: 'ignore this tab and do not use it' };
			}
			tabInfos.push(tabInfo);
		}

		return tabInfos;
	}

	@requireInitialization
	async closeTab(tabIndex?: number): Promise<void> {
		const pages = this.browserContext?.pages() || [];
		if (!pages.length) return;

		let page;
		if (!tabIndex) {
			page = await this.getCurrentPage();
		} else {
			page = pages[tabIndex];
		}
		if (!page) throw new Error('No page to close');
		await page.close();

		// reset the self.agent_current_page and self.human_current_page references to first available tab
		await this.getCurrentPage();
	}
	// #endregion

	// #region Page navigation
	@requireInitialization
	async navigate(url: string): Promise<void> {
		if (this.agentCurrentPage) {
			await this.agentCurrentPage.goto(url);
		} else {
			await this.createNewTab(url);
		}
	}

	@requireInitialization
	async refresh(): Promise<void> {
		if (this.agentCurrentPage && !this.agentCurrentPage.isClosed()) {
			await this.agentCurrentPage.reload();
		} else {
			await this.createNewTab();
		}
	}

	@requireInitialization
	async executeJavascript(script: string) {
		const page = await this.getCurrentPage();
		return await page.evaluate(new Function('return ' + script)());
	}

	async navigateTo(url: string): Promise<void> {
		const page = await this.getCurrentPage();
		if (this._isUrlBlocked(url)) {
			throw new BrowserError(`Navigation to non-allowed URL: ${url}`);
		}

		await page.goto(url);
		await page.waitForLoadState();
	}

	async refreshPage(): Promise<void> {
		const page = await this.getCurrentPage();
		await page.reload();
		await page.waitForLoadState();
	}

	async goBack(): Promise<void> {
		const page = await this.getCurrentPage();
		try {
			await page.goBack({ timeout: 10, waitUntil: 'domcontentloaded' });

			// await this._waitForPageAndFramesLoad()
		} catch (e) {
			console.debug(`⏮️  Error during go_back: ${e}`);
		}
	}

	async goForward(): Promise<void> {
		const page = await this.getCurrentPage();
		try {
			await page.goForward({ timeout: 10, waitUntil: 'domcontentloaded' });
		} catch (e) {
			console.debug(`⏭️  Error during go_forward: ${e}`);
		}
	}

	async closeCurrentTab(): Promise<void> {
		const isForeground = this.agentCurrentPage == this.humanCurrentPage;

		try {
			await this.agentCurrentPage?.close();
		} catch (e) {
			console.debug(`⛔️  Error during close_current_tab: ${e}`);
		}

		this.agentCurrentPage = undefined;

		if (isForeground) {
			this.humanCurrentPage = undefined;
		}

		if (this.browserContext.pages().length) {
			await this.switchToTab(0);
		}
	}

	async getPageHtml(): Promise<string> {
		const page = await this.getCurrentPage();
		return await page.content();
	}

	async getPageStructure(): Promise<string> {
		const page = await this.getCurrentPage();
		const structure = await page.evaluate<string>(new Function('return ' + PAGE_STRUCTURE_JS)());
		return structure;
	}

	@timeExecutionAsync('--get_state_summary')
	async getStateSummary(cacheClickableElementsHashes: boolean): Promise<BrowserStateSummary> {
		await this._waitForPageAndFramesLoad();
		const updatedState = await this._getUpdatedState();

		if (cacheClickableElementsHashes) {
			if (
				this._cachedClickableElementHashes &&
				this._cachedClickableElementHashes.url == updatedState.url
			) {
				const updatedStateClickableElements = this.clickableElementProcessor.getClickableElements(
					updatedState.elementTree,
				);

				for (const domElement of updatedStateClickableElements) {
					const hash = this.clickableElementProcessor.hashDomElement(domElement);
					domElement.isNew = !this._cachedClickableElementHashes.hashes.has(hash);
				}
			}

			this._cachedClickableElementHashes = {
				url: updatedState.url,
				hashes: this.clickableElementProcessor.getClickableElementsHashes(updatedState.elementTree),
			};
		}

		assert(updatedState);
		this.browserStateSummary = updatedState;

		await this.session.saveStorageState();

		return this.browserStateSummary!;
	}

	// #endregion

	// #region - Browser Actions
	@timeExecutionAsync('--click_element_node')
	async clickElementNode(elementNode: DOMElementNode): Promise<string | undefined> {
		const page = await this.getCurrentPage();
		try {
			// Highlight before clicking (optional, not implemented)
			// if (elementNode.highlightIndex !== undefined) {
			//     await this.updateState({ focus_element: elementNode.highlightIndex });
			// }

			const elementHandle = await this.getLocateElement(elementNode);
			if (!elementHandle) {
				throw new Error(`Element: ${JSON.stringify(elementNode)} not found`);
			}

			const performClick = async (clickFunc: () => Promise<void>): Promise<string | undefined> => {
				if (this.browserProfile.downloadsPath) {
					try {
						// Try short-timeout expect_download to detect a file download
						const [download] = await Promise.all([
							page.waitForEvent('download', { timeout: 5000 }),
							clickFunc(),
						]);
						const suggestedFilename = download.suggestedFilename();
						// Generate a unique filename
						const uniqueFilename = await getUniqueFilename(
							this.browserProfile.downloadsPath,
							suggestedFilename,
						);
						const downloadPath = `${this.browserProfile.downloadsPath}/${uniqueFilename}`;
						await download.saveAs(downloadPath);
						console.debug(`⬇️  Download triggered. Saved file to: ${downloadPath}`);
						return downloadPath;
					} catch (e: any) {
						if (e.name === 'TimeoutError') {
							console.debug('No download triggered within timeout. Checking navigation...');
							await page.waitForLoadState();
							await this._checkAndHandleNavigation(page);
						} else {
							throw e;
						}
					}
				} else {
					// If no download is triggered, treat as normal click
					await clickFunc();
					await page.waitForLoadState();
					await this._checkAndHandleNavigation(page);
				}
				return undefined;
			};

			try {
				return await performClick(() => elementHandle.click({ timeout: 1500 }));
			} catch (e) {
				if (e instanceof URLNotAllowedError) {
					throw e;
				}
				try {
					return await performClick(() => {
						return page.evaluate(new Function('return ' + '(el) => el.click()')(), elementHandle);
					});
				} catch (err) {
					throw err;
				}
			}
		} catch (e: any) {
			console.debug(
				`❌  Failed to click element: ${JSON.stringify(elementNode)}. Error: ${e?.message ?? e}`,
			);
			throw new BrowserError(`Failed to click element: ${JSON.stringify(elementNode)}`);
		}
	}

	@timeExecutionAsync('--take_screenshot')
	async takeScreenshot(fullPage: boolean = false): Promise<string> {
		const page = await this.getCurrentPage();

		await page.waitForLoadState();

		const screenshot = await page.screenshot({
			fullPage,
			animations: 'disabled',
			caret: 'initial',
		});

		const screenshotB64 = Buffer.from(screenshot).toString('base64');
		return screenshotB64;
	}
	// #endregion

	// #region - User Actions
	@timeExecutionAsync('--is_visible')
	async isVisible(element: ElementHandle): Promise<boolean> {
		const isHidden = await element.isHidden();
		const bbox = await element.boundingBox();
		return !isHidden && bbox !== null && bbox.width > 0 && bbox.height > 0;
	}

	@timeExecutionAsync('--get_locate_element')
	async getLocateElement(element: DOMElementNode): Promise<ElementHandle | null> {
		const page = await this.getCurrentPage();

		let currentFrame: Page | FrameLocator = page;

		const parents: DOMElementNode[] = [];
		let current = element;
		while (current.parent) {
			const parent = current.parent;
			parents.push(parent);
			current = parent;
		}
		parents.reverse();

		const iframes = parents.filter((p) => p.tagName == 'iframe');
		for (const parent of iframes) {
			const cssSelector = enhancedCssSelectorForElement(
				parent,
				this.browserProfile.includeDynamicAttributes,
			);
			currentFrame = currentFrame.frameLocator(cssSelector);
		}

		const cssSelector = enhancedCssSelectorForElement(
			element,
			this.browserProfile.includeDynamicAttributes,
		);

		try {
			if ('first' in currentFrame) {
				const elementHandle = await currentFrame.locator(cssSelector).elementHandle();
				return elementHandle;
			} else {
				const elementHandle = await currentFrame.$(cssSelector);
				if (elementHandle) {
					const isVisible = await this.isVisible(elementHandle);
					if (isVisible) {
						await elementHandle.scrollIntoViewIfNeeded();
					}
					return elementHandle;
				}
				return null;
			}
		} catch (e) {
			console.error(`❌  Failed to locate element: ${e}`);
			return null;
		}
	}

	@timeExecutionAsync('--get_locate_element_by_xpath')
	async getLocateElementByXPath(xpath: string): Promise<ElementHandle | null> {
		const page = await this.getCurrentPage();
		try {
			const elementHandle = await page.$(`xpath=${xpath}`);
			if (elementHandle) {
				const isVisible = await this.isVisible(elementHandle);
				if (isVisible) {
					await elementHandle.scrollIntoViewIfNeeded();
				}
				return elementHandle;
			}
			return null;
		} catch (e) {
			console.error(`❌  Failed to locate element by XPath ${xpath}: ${e}`);
			return null;
		}
	}

	@timeExecutionAsync('--get_locate_element_by_css_selector')
	async getLocateElementByCssSelector(cssSelector: string): Promise<ElementHandle | null> {
		const page = await this.getCurrentPage();
		try {
			const elementHandle = await page.$(cssSelector);
			if (elementHandle) {
				const isVisible = await this.isVisible(elementHandle);
				if (isVisible) {
					await elementHandle.scrollIntoViewIfNeeded();
				}
				return elementHandle;
			}
			return null;
		} catch (e) {
			console.error(`❌  Failed to locate element by CSS selector ${cssSelector}: ${e}`);
			return null;
		}
	}

	@timeExecutionAsync('--get_locate_element_by_text')
	async getLocateElementByText({
		text,
		nth = 0,
		elementType = '*',
	}: {
		text: string;
		nth?: number;
		elementType?: string;
	}): Promise<ElementHandle | undefined> {
		const page = await this.getCurrentPage();
		try {
			const selector = `${elementType}:text("${text}")`;
			const elements = await page.$$(selector);
			const visibleElements = elements.filter(async (el) => await this.isVisible(el));

			if (!visibleElements.length) {
				console.error(`❌  No visible element with text '${text}' found.`);
				return;
			}

			let elementHandle: ElementHandle | undefined = undefined;
			if (nth !== undefined) {
				if (0 <= nth && nth < visibleElements.length) {
					elementHandle = visibleElements[nth];
				} else {
					console.error(`❌  Visible element with text '${text}' not found at index ${nth}.`);
					return;
				}
			} else {
				elementHandle = visibleElements[0];
			}

			if (elementHandle) {
				const isVisible = await this.isVisible(elementHandle);
				if (isVisible) {
					await elementHandle.scrollIntoViewIfNeeded();
				}
			}
			return elementHandle;
		} catch (e) {
			console.error(`❌  Failed to locate element by text '${text}': ${e}`);
			return;
		}
	}

	@requireInitialization
	@timeExecutionAsync('--input_text_element_node')
	async inputTextElementNode(elementNode: DOMElementNode, text: string): Promise<void> {
		try {
			const elementHandle = await this.getLocateElement(elementNode);

			if (!elementHandle) {
				throw new BrowserError(`Element: ${elementNode} not found`);
			}

			// Ensure element is ready for input
			try {
				await elementHandle.waitForElementState('stable', { timeout: 1000 });
				const isVisible = await this.isVisible(elementHandle);
				if (isVisible) {
					await elementHandle.scrollIntoViewIfNeeded();
				}
			} catch (e) {
				// pass
			}

			// Get element properties to determine input method
			const tagHandle = await elementHandle.getProperty('tagName');
			const tagName = (await tagHandle.jsonValue()).toLowerCase();
			const isContentEditable = await elementHandle.getProperty('isContentEditable');
			const readonlyHandle = await elementHandle.getProperty('readOnly');
			const disabledHandle = await elementHandle.getProperty('disabled');

			const readonly = readonlyHandle ? await readonlyHandle.jsonValue() : false;
			const disabled = disabledHandle ? await disabledHandle.jsonValue() : false;

			// always click the element first to make sure it's in the focus
			await elementHandle.click();
			await sleep(100);

			try {
				if (
					(tagName == 'input' || (await isContentEditable.jsonValue())) &&
					!(readonly || disabled)
				) {
					await elementHandle.evaluate('el => {el.textContent = ""; el.value = "";}');
					await elementHandle.press(text, { delay: 5 });
				} else {
					await elementHandle.fill(text);
				}
			} catch (e) {
				// last resort fallback, assume it's already focused after we clicked on it,
				// just simulate keypresses on the entire page
				const page = await this.getCurrentPage();
				await page.keyboard.type(text);
			}
		} catch (e) {
			console.debug(`❌  Failed to input text into element: ${elementNode}. Error: ${e}`);
			throw new BrowserError(`Failed to input text into index ${elementNode.highlightIndex}`);
		}
	}

	@requireInitialization
	@timeExecutionAsync('--switch_to_tab')
	async switchToTab(pageId: number): Promise<Page> {
		const pages = this.browserContext.pages();

		if (pageId >= pages.length) {
			throw new BrowserError(`No tab found with page_id: ${pageId}`);
		}

		const page = pages[pageId]!;

		// Check if the tab's URL is allowed before switching
		if (this._isUrlBlocked(page.url())) {
			throw new URLNotAllowedError(`Cannot switch to tab with non-allowed URL: ${page.url()}`);
		}

		// Update both tab references - agent wants this tab, and it's now in the foreground
		this.agentCurrentPage = page;
		this.humanCurrentPage = page;

		// Bring tab to front and wait for it to load
		await page.bringToFront();
		await page.waitForLoadState('load');

		// Set the viewport size for the tab
		if (this.browserProfile.viewport) {
			await page.setViewportSize(this.browserProfile.viewport);
		}

		return page;
	}

	@timeExecutionAsync('--create_new_tab')
	async createNewTab(url?: string): Promise<Page> {
		if (url && this._isUrlBlocked(url)) {
			throw new URLNotAllowedError(`Cannot create new tab with non-allowed URL: ${url}`);
		}

		const newPage = await this.browserContext.newPage();

		// Update agent tab reference
		this.agentCurrentPage = newPage;

		// Update human tab reference if there is no human tab yet
		if (!this.humanCurrentPage || this.humanCurrentPage.isClosed()) {
			this.humanCurrentPage = newPage;
		}

		await newPage.waitForLoadState('domcontentloaded');

		// Set the viewport size for the new tab
		if (this.browserProfile.viewport) {
			await newPage.setViewportSize(this.browserProfile.viewport);
		}

		if (url) {
			await newPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
			await this._waitForPageAndFramesLoad();
		}

		assert(this.humanCurrentPage && this.agentCurrentPage);

		return newPage;
	}
	// #endregion

	// #region - Helper methods for easier access to the DOM

	@requireInitialization
	async getSelectorMap(): Promise<SelectorMap> {
		if (!this.browserStateSummary) {
			return new Map();
		}
		return this.browserStateSummary.selectorMap;
	}

	@requireInitialization
	async getElementByIndex(index: number): Promise<ElementHandle | null> {
		const selectorMap = await this.getSelectorMap();
		const element = selectorMap.get(index);
		if (!element) return null;
		const elementHandle = await this.getLocateElement(element);
		return elementHandle;
	}

	@requireInitialization
	async findFileUploadElementByIndex(index: number): Promise<DOMElementNode | undefined> {
		try {
			const selectorMap = await this.getSelectorMap();
			if (!selectorMap.has(index)) {
				return;
			}

			const candidateElement = selectorMap.get(index)!;

			const isFileInput = (node: DOMElementNode) => {
				return (
					node instanceof DOMElementNode &&
					node.tagName == 'input' &&
					node.attributes['type'] == 'file'
				);
			};

			const findElementById = (
				node: DOMBaseNode,
				elementId: string,
			): DOMElementNode | undefined => {
				if (node instanceof DOMElementNode) {
					if (node.attributes['id'] == elementId) {
						return node;
					}
					for (const child of node.children) {
						const result = findElementById(child, elementId);
						if (result) {
							return result;
						}
					}
					return;
				}
				return;
			};

			const getRoot = (node: DOMElementNode) => {
				let root = node;
				while (root.parent) {
					root = root.parent;
				}
				return root;
			};

			// Recursively search for file input in node and its children
			const findFileInputRecursive = (
				node: DOMBaseNode,
				maxDepth: number = 3,
				currentDepth: number = 0,
			): DOMElementNode | undefined => {
				if (currentDepth > maxDepth || !(node instanceof DOMElementNode)) {
					return;
				}

				// Check current element
				if (isFileInput(node)) {
					return node;
				}

				// Recursively check children
				if (node.children && currentDepth < maxDepth) {
					for (const child of node.children) {
						if (child instanceof DOMElementNode) {
							const result = findFileInputRecursive(child, maxDepth, currentDepth + 1);
							if (result) {
								return result;
							}
						}
					}
				}

				return;
			};

			// Check if current element is a file input
			if (isFileInput(candidateElement)) {
				return candidateElement;
			}

			// Check if it's a label pointing to a file input
			if (candidateElement.tagName == 'label' && candidateElement.attributes['for']) {
				const inputId = candidateElement.attributes['for'];
				const rootElement = getRoot(candidateElement);

				const targetInput = findElementById(rootElement, inputId);
				if (targetInput && isFileInput(targetInput)) {
					return targetInput;
				}

				// Recursively check children
				const childResult = findFileInputRecursive(candidateElement);
				if (childResult) {
					return childResult;
				}

				// Check siblings
				if (candidateElement.parent) {
					for (const sibling of candidateElement.parent.children) {
						if (sibling !== candidateElement && sibling instanceof DOMElementNode) {
							if (isFileInput(sibling)) {
								return sibling;
							}
						}
					}
				}
			}

			return;
		} catch (error) {
			const page = await this.getCurrentPage();
			console.error(
				`❌ Error in find_file_upload_element_by_index(index=${index}) on page ${page.url()}`,
			);
			return;
		}
	}

	async getScrollInfo(page: Page): Promise<[number, number]> {
		const scrollY = await page.evaluate<number>('window.scrollY');
		const viewportHeight = await page.evaluate<number>('window.innerHeight');
		const totalHeight = await page.evaluate<number>('document.documentElement.scrollHeight');
		const pixelsAbove = scrollY;
		const pixelsBelow = totalHeight - (scrollY + viewportHeight);
		return [pixelsAbove, pixelsBelow];
	}

	async scrollContainer(pixels: number) {
		const page = await this.getCurrentPage();

		await page.evaluate(new Function('return ' + SMART_SCROLL_JS)(), pixels);
	}
	// #endregion

	// #region - Private methods
	private async _waitForStableNetwork() {
		const page = await this.getCurrentPage();

		const pendingRequests = new Set<Request>();
		let lastActivity = performance.now();

		// Define relevant resource types and content types
		const RELEVANT_RESOURCE_TYPES = ['document', 'stylesheet', 'image', 'font', 'script', 'iframe'];

		const RELEVANT_CONTENT_TYPES = [
			'text/html',
			'text/css',
			'application/javascript',
			'image/',
			'font/',
			'application/json',
		];

		// Additional patterns to filter out
		const IGNORED_URL_PATTERNS = [
			// Analytics and tracking
			'analytics',
			'tracking',
			'telemetry',
			'beacon',
			'metrics',
			// Ad - related
			'doubleclick',
			'adsystem',
			'adserver',
			'advertising',
			// Social media widgets
			'facebook.com/plugins',
			'platform.twitter',
			'linkedin.com/embed',
			// Live chat and support
			'livechat',
			'zendesk',
			'intercom',
			'crisp.chat',
			'hotjar',
			// Push notifications
			'push-notifications',
			'onesignal',
			'pushwoosh',
			// Background sync/ heartbeat
			'heartbeat',
			'ping',
			'alive',
			// WebRTC and streaming
			'webrtc',
			'rtmp://',
			'wss://',
			// Common CDNs for dynamic content
			'cloudfront.net',
			'fastly.net',
		];

		const onRequest = async (request: Request) => {
			if (!RELEVANT_RESOURCE_TYPES.includes(request.resourceType())) return;

			if (
				['websocket', 'media', 'eventsource', 'manifest', 'other'].includes(request.resourceType())
			)
				return;

			const url = request.url().toLowerCase();
			if (IGNORED_URL_PATTERNS.some((pattern) => url.includes(pattern))) return;

			// Filter out data URLs and blob URLs
			if (url.startsWith('data:') || url.startsWith('blob:')) return;

			const headers = request.headers();
			if (
				headers['purpose'] === 'prefetch' ||
				(headers['sec-fetch-dest'] && headers['sec-fetch-dest'] in ['video', 'audio'])
			)
				return;

			pendingRequests.add(request);
			lastActivity = performance.now();
		};
		const onResponse = async (response: Response) => {
			const request = response.request();
			if (!pendingRequests.has(request)) return;

			// Filter by content type if available
			const contentType = response.headers()['content-type']?.toLowerCase();

			// Skip if content type indicates streaming or real-time data
			if (
				contentType &&
				(contentType.includes('streaming') ||
					contentType.includes('video') ||
					contentType.includes('audio') ||
					contentType.includes('webm') ||
					contentType.includes('mp4') ||
					contentType.includes('event-stream') ||
					contentType.includes('websocket') ||
					contentType.includes('protobuf'))
			) {
				pendingRequests.delete(request);
				return;
			}

			// Only process relevant content types
			if (
				contentType &&
				[
					'streaming',
					'video',
					'audio',
					'webm',
					'mp4',
					'event-stream',
					'websocket',
					'protobuf',
				].some((ct) => contentType.includes(ct))
			) {
				pendingRequests.delete(request);
				return;
			}

			// Only process relevant content types
			if (!RELEVANT_CONTENT_TYPES.some((ct) => contentType?.includes(ct))) {
				pendingRequests.delete(request);
				return;
			}

			const contentLength = response.headers()['content-length'];
			if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
				// 5MB
				pendingRequests.delete(request);
				return;
			}

			pendingRequests.delete(request);
			lastActivity = performance.now();
		};

		// Attach event listeners
		page.on('request', onRequest);
		page.on('response', onResponse);

		try {
			// Wait for idle time
			const startTime = performance.now();
			while (true) {
				await sleep(100);
				const now = performance.now();
				if (
					pendingRequests.size === 0 &&
					now - lastActivity >= this.browserProfile.waitForNetworkIdlePageLoadTime
				) {
					break;
				}
				if (now - startTime > this.browserProfile.maximumWaitPageLoadTime) {
					console.debug(
						`Network timeout after ${this.browserProfile.maximumWaitPageLoadTime}s with ${pendingRequests.size} pending requests: ${Array.from(pendingRequests).map((r) => r.url)}`,
					);
					break;
				}
			}
		} finally {
			page.removeListener('request', onRequest);
			page.removeListener('response', onResponse);
		}

		console.debug(
			`⚖️  Network stabilized for ${this.browserProfile.waitForNetworkIdlePageLoadTime} seconds`,
		);
	}

	private async _waitForPageAndFramesLoad(timeoutOverwrite?: number) {
		const startTime = Date.now() * 1000; // seconds

		const page = await this.getCurrentPage();
		try {
			await this._waitForStableNetwork();

			await this._checkAndHandleNavigation(page);
		} catch (e) {
			if (e instanceof URLNotAllowedError) {
				throw e;
			}
			console.warn('⚠️  Page load failed, continuing...');
		}

		const elapsed = Date.now() * 1000 - startTime;
		const remaining = Math.max(
			(timeoutOverwrite || this.browserProfile.minimumWaitPageLoadTime) - elapsed,
			0,
		);

		console.debug(
			`--Page loaded in ${elapsed.toFixed(2)} seconds, waiting for additional ${remaining.toFixed(2)} seconds`,
		);

		if (remaining > 0) {
			await sleep(remaining);
		}
	}

	private _isUrlBlocked(url: string) {
		if (!this.browserProfile.blockedDomains) return false;

		const _showGlobWarning = (domain: string, glob: string) => {
			if (!_GLOB_WARNING_SHOWN) {
				console.warn(
					`⚠️ Allowing agent to visit ${domain} based on allowed_domains=['${glob}', ...]. Set allowed_domains=['${domain}', ...] explicitly to avoid matching too many domains!`,
				);
				_GLOB_WARNING_SHOWN = true;
			}
		};

		try {
			const parsedUrl = new URL(url);

			if (
				url == 'about:blank' ||
				['chrome', 'brave', 'edge', 'chrome-extension'].includes(parsedUrl.protocol.toLowerCase())
			) {
				return false;
			}

			// Extract only the hostname component(without auth credentials or port)
			// Hostname returns only the domain portion, ignoring username:password and port
			const domain = parsedUrl.hostname ? parsedUrl.hostname.toLowerCase() : '';

			if (!domain) return false;

			for (let blockedDomain of this.browserProfile.blockedDomains) {
				blockedDomain = blockedDomain.toLowerCase();

				// Handle glob patterns
				if (blockedDomain.includes('*')) {
					let parentDomain;
					// Special handling for *.domain.tld pattern to also match the bare domain
					if (blockedDomain.startsWith('*.'))
						// If pattern is *.example.com, also allow example.com(without subdomain)
						parentDomain = blockedDomain.slice(2); // Remove the '*.' prefix
					else parentDomain = blockedDomain;

					if (domain == parentDomain || minimatch(domain, blockedDomain)) {
						_showGlobWarning(domain, blockedDomain);
						return false;
					} else {
						// For other glob patterns like * google.com
						if (minimatch(domain, blockedDomain)) {
							_showGlobWarning(domain, blockedDomain);
							return false;
						}
					}
				} else {
					// Standard matching(exact or subdomain)
					if (domain == blockedDomain) return false;
				}
			}

			return true;
		} catch (e) {
			console.error(
				`❌  Error checking URL allowlist: ${(e as Error).name}: ${(e as Error).message}`,
			);
			return true;
		}
	}

	private async _checkAndHandleNavigation(page: Page) {
		if (this._isUrlBlocked(page.url())) {
			console.warn(`⛔️  Navigation to non-allowed URL detected: ${page.url()}`);
			try {
				await this.goBack();
			} catch (e) {
				console.error(`⛔️  Failed to go back after detecting non-allowed URL: ${e}`);
			}
			throw new URLNotAllowedError(`Navigation to non-allowed URL: ${page.url()}`);
		}
	}

	private async _getUpdatedState(focusElement = -1): Promise<BrowserStateSummary> {
		const page = await this.getCurrentPage();

		// Check if current page is still valid, if not switch to another available page
		try {
			// Test if page is still accessible
			await page.evaluate('1');
		} catch (e) {
			console.debug(
				`👋  Current page is no longer accessible: ${(e as Error).name}: ${(e as Error).message}`,
			);
			throw new BrowserError('Browser closed: no valid pages available');
		}

		try {
			await this.removeHighlights();
			const content = await this.domService.getClickableElements(page, {
				focusElement,
				viewportExpansion: this.browserProfile.viewportExpansion,
				highlightElements: this.browserProfile.highlightElements,
			});

			const tabsInfo = await this.getTabsInfo();

			const screenshotB64 = await this.takeScreenshot();
			const [pixelsAbove, pixelsBelow] = await this.getScrollInfo(page);

			this.browserStateSummary = new BrowserStateSummary({
				...content,
				url: page.url(),
				title: await page.title(),
				tabs: tabsInfo,
				screenshot: screenshotB64,
				pixelsAbove,
				pixelsBelow,
			});

			return this.browserStateSummary!;
		} catch (e) {
			console.error(`❌  Failed to update state: ${e}`);
			// Return last known good state if available
			if (this.browserStateSummary) {
				return this.browserStateSummary;
			}
			throw e;
		}
	}
	// #endregion
}

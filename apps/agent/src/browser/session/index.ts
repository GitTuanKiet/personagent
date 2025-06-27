// #region Python source reference: https://raw.githubusercontent.com/browser-use/browser-use/refs/heads/main/browser_use/browser/session.py
// Last updated: 2025-05-30

import assert from 'node:assert';
import { join } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import psList from 'ps-list';
import type { BrowserContextOptions, Page, Browser } from 'patchright';
import { chromium } from 'patchright';
import { DEFAULT_CHANNEL, INIT_SCRIPT } from './const.js';
import { BrowserError } from './interface.js';
import { BrowserSessionAbstract, type BrowserSessionAbstractArgs } from './abstract.js';

// eslint-disable-next-line turbo/no-undeclared-env-vars
process.env['PW_TEST_SCREENSHOT_NO_FONTS_READY'] = '1'; // https://github.com/microsoft/playwright/issues/35972

export interface BrowserSessionArgs extends BrowserSessionAbstractArgs {
	browserPid?: number;
}

export class BrowserSession extends BrowserSessionAbstract {
	private startLock?: Promise<void>;

	browserPid?: number;
	initialized: boolean = false;

	constructor({ browserPid, ...args }: BrowserSessionArgs) {
		super(args);
		this.browserPid = browserPid;
	}

	async newContext(options?: BrowserContextOptions): Promise<this> {
		if (!this.browser) throw new BrowserError('Browser is not initialized');
		if (this.browserContext) {
			await this.browserContext.close();
		}
		this.browserContext = await this.browser.newContext(options ?? {});
		this.agentCurrentPage = await this.browserContext.newPage();
		return this;
	}

	/**
	 * Start the browser session by either connecting to an existing browser or launching a new one.
	 * Priority order:
	 * 1. agentCurrentPage (Page) -> use its context
	 * 2. browserContext -> use its browser
	 * 3. browser -> use first context or create new
	 * 4. browserPid -> connect via CDP
	 * 5. wssUrl -> connect via WSS
	 * 6. cdpUrl -> connect via CDP
	 * 7. launch new
	 */
	async start(): Promise<void> {
		if (this.startLock) {
			await this.startLock;
			return;
		}
		this.startLock = (async () => {
			if (this.initialized && this.isConnected()) return;
			this._resetConnectionState();
			this.initialized = true;
			try {
				await this._setupPlaywright();

				this.browserProfile.prepareUserDataDir();
				this.browserProfile.detectDisplayConfiguration();

				await this._setupBrowserViaPassedObjects();
				await this._setupBrowserViaBrowserPid();
				await this._setupBrowserViaWssUrl();
				await this._setupBrowserViaCdpUrl();
				await this._setupNewBrowserContext();

				assert(
					this.browserContext,
					`Failed to connect to or create a new BrowserContext for browser=${this.browser}`,
				);

				await this._setupViewportSizing();
				await this._setupCurrentPageChangeListeners();
			} catch (error) {
				this.initialized = false;
				throw error;
			} finally {
				this.startLock = undefined;
			}
		})();
		await this.startLock;
	}

	async stop(): Promise<void> {
		if (!this.initialized) return;
		if (this.browserProfile.keepAlive) {
			console.info(
				'🕊️ .stop() called but keepAlive=true, leaving the browser running. Use .kill() to force close.',
			);
			return;
		}
		// Close context
		if (this.browserContext) {
			try {
				await this.browserContext.close();
				console.info('🛑 Closed BrowserContext');
			} catch (e) {
				console.debug(
					`❌ Error closing BrowserContext: ${e instanceof Error ? e.constructor.name : typeof e}: ${e}`,
				);
			}
			this.browserContext = undefined;
		}
		// Close browser
		if (this.browser) {
			try {
				await this.browser.close();
				console.info('🛑 Closed Browser');
			} catch (e) {
				console.debug(
					`❌ Error closing Browser: ${e instanceof Error ? e.constructor.name : typeof e}: ${e}`,
				);
			}
			this.browser = undefined;
		}
		// Kill process if exists
		if (this.browserPid) {
			try {
				process.kill(this.browserPid);
				console.info(`🛑 Killed browser subprocess with pid=${this.browserPid}`);
			} catch (e) {
				if (e instanceof Error && !e.message.includes('ESRCH')) {
					console.debug(
						`❌ Error terminating chrome subprocess pid=${this.browserPid}: ${e.constructor.name}: ${e.message}`,
					);
				}
			}
			this.browserPid = undefined;
		}
		this._resetConnectionState();
		this.initialized = false;
	}

	private _resetConnectionState() {
		this.initialized = false;
		this.browser = undefined;
		this.browserContext = undefined;
		this.agentCurrentPage = undefined;
		this.humanCurrentPage = undefined;
		this.browserPid = undefined;
	}

	/**
	 * Check if the browser session has valid, connected browser and context objects.
	 */
	isConnected(): boolean {
		if (!this.browserContext) return false;

		try {
			if (!this.browser?.isConnected()) return false;
			if (!this.browserContext.browser()?.isConnected()) return false;
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Use passed Page/Context/Browser objects if available.
	 */
	private async _setupBrowserViaPassedObjects(): Promise<void> {
		this.browserContext = this.agentCurrentPage?.context() || this.browserContext;
		if (this.browserContext) {
			try {
				void this.browserContext.pages();
				if (this.browserContext.browser() && !this.browserContext.browser()?.isConnected()) {
					this.browserContext = undefined;
				}
			} catch {
				this.browserContext = undefined;
			}
		}
		if (this.browser && !this.browser.isConnected()) {
			if (this.browserContext && this.browserContext.browser() === this.browser) {
				this.browserContext = undefined;
			}
			this.browser = undefined;
		}
		let browserFromContext: Browser | null = null;
		if (this.browserContext) {
			browserFromContext = this.browserContext.browser();
		}
		this.browser =
			browserFromContext && browserFromContext.isConnected() ? browserFromContext : this.browser;
		if (this.browser || this.browserContext) {
			console.info(
				`🌎 Connected to existing user-provided browser_context: ${this.browserContext}`,
			);
			this.browserProfile.keepAlive = true;
		}
	}

	/**
	 * If browserPid is provided, connect to it via CDP.
	 */
	private async _setupBrowserViaBrowserPid(): Promise<void> {
		if (this.browser || this.browserContext) return;
		if (!this.browserPid && !this.browserPid) return;
		const pid = this.browserPid || this.browserPid;
		const processes = await psList();
		const chromeProc = processes.find((p) => p.pid === pid);
		if (!chromeProc) return;
		const cmd = chromeProc.cmd;
		const debugArg = cmd?.split(' ').find((arg) => arg.startsWith('--remote-debugging-port='));
		const debugPort = debugArg?.split('=')[1]?.trim();
		assert(
			debugPort,
			`Could not find --remote-debugging-port=... to connect to in browser launch args: browser_pid=${pid} ${cmd}`,
		);
		this.browserProfile.cdpUrl = this.browserProfile.cdpUrl || `http://localhost:${debugPort}/`;
		console.info(
			`🌎 Connecting to existing local browser process: browser_pid=${pid} on ${this.browserProfile.cdpUrl}`,
		);
		this.browser =
			this.browser ||
			(await chromium.connectOverCDP(
				this.browserProfile.cdpUrl,
				this.browserProfile.toConnectOverCDPOptions(),
			));
		this.browserProfile.keepAlive = true;
	}

	/**
	 * If wssUrl is provided, connect to remote playwright browser server via WSS.
	 */
	private async _setupBrowserViaWssUrl(): Promise<void> {
		if (this.browser || this.browserContext) return;
		if (!this.browserProfile.wssUrl) return;
		console.info(
			`🌎 Connecting to existing remote chromium playwright node.js server over WSS: ${this.browserProfile.wssUrl}`,
		);
		this.browser =
			this.browser ||
			(await chromium.connect(this.browserProfile.wssUrl, this.browserProfile.toConnectOptions()));
		this.browserProfile.keepAlive = true;
	}

	/**
	 * If cdpUrl is provided, connect to remote chromium-based browser via CDP.
	 */
	private async _setupBrowserViaCdpUrl(): Promise<void> {
		if (this.browser || this.browserContext) return;
		if (!this.browserProfile.cdpUrl) return;
		console.info(
			`🌎 Connecting to existing remote chromium-based browser over CDP: ${this.browserProfile.cdpUrl}`,
		);
		this.browser =
			this.browser ||
			(await chromium.connectOverCDP(
				this.browserProfile.cdpUrl,
				this.browserProfile.toConnectOverCDPOptions(),
			));
		this.browserProfile.keepAlive = true;
	}

	/**
	 * Launch a new browser and browserContext if none exists.
	 */
	private async _setupNewBrowserContext(): Promise<void> {
		const currentProcess = process.pid;
		const childPidsBeforeLaunch = new Set(
			(await psList())
				.filter((p) => p.ppid === currentProcess)
				.map((h) => h.pid)
				.filter((pid) => typeof pid === 'number'),
		);
		if (this.browser && !this.browserContext) {
			const contexts = this.browser.contexts();
			if (contexts.length > 0) {
				this.browserContext = contexts[0]!;
				console.info(
					`🌎 Using first browser_context available in existing browser: ${this.browserContext}`,
				);
			} else {
				this.browserContext = await this.browser.newContext(
					this.browserProfile.toBrowserContextOptions(),
				);
				const cookieCount =
					typeof this.browserProfile.storageState === 'string'
						? 0
						: this.browserProfile.storageState?.cookies?.length || 0;
				const storageInfo = cookieCount ? ` + loaded storage_state=${cookieCount} cookies` : '';
				console.info(
					`🌎 Created new empty browser_context in existing browser${storageInfo}: ${this.browserContext}`,
				);
			}
		}
		if (!this.browserContext) {
			if (!this.browserProfile.userDataDir) {
				this.browser =
					this.browser || (await chromium.launch(this.browserProfile.toLaunchOptions()));
				this.browserContext = await this.browser?.newContext(
					this.browserProfile.toBrowserContextOptions(),
				);
			} else {
				this.browserProfile.prepareUserDataDir();
				for (const proc of await psList()) {
					if (proc.cmd?.includes(`--user-data-dir=${this.browserProfile.userDataDir}`)) {
						console.warn(
							`🚨 Found potentially conflicting Chrome process pid=${proc.pid} already running with the same user_data_dir=${this.browserProfile.userDataDir}`,
						);
						break;
					}
				}

				try {
					this.browserContext = await chromium.launchPersistentContext(
						this.browserProfile.userDataDir,
						this.browserProfile.toLaunchPersistentContextOptions(),
					);
				} catch (error) {
					let userDataDirChromeVersion = '???';
					let testBrowserVersion = '???';
					try {
						userDataDirChromeVersion = await readFile(
							`${this.browserProfile.userDataDir}/Last Version`,
							'utf-8',
						).then((text) => text.trim());
					} catch {}
					try {
						const testBrowser = await chromium.launch(this.browserProfile.toLaunchOptions());
						testBrowserVersion = testBrowser?.version();
						await testBrowser.close();
					} catch {}
					const reason =
						'due to bad' +
						(error instanceof Error && error.message.includes('Failed parsing extensions')
							? ''
							: ' for unknown reason with');
					const driver = chromium.name();
					const browserChannel = this.browserProfile.executablePath
						? this.browserProfile.executablePath
								.split('/')
								.pop()
								?.replace(' ', '-')
								.replace('.exe', '')
								.toLowerCase()
						: (this.browserProfile.channel || DEFAULT_CHANNEL).toLowerCase();
					console.error(
						`❌ ${this.constructor.name} Launching new local browser ${driver}:${browserChannel} (v${testBrowserVersion}) failed!` +
							`\n\tFailed ${reason} user_data_dir= ${this.browserProfile.userDataDir} (created with v${userDataDirChromeVersion})` +
							`\n\tTry using a different browser version/channel or delete the user_data_dir to start over with a fresh profile.` +
							`\n\t(can happen if different versions of Chrome/Chromium/Brave/etc. tried to share one dir)`,
					);
					throw error;
				}
			}
			let browserFromContext: Browser | null = null;
			if (this.browserContext) {
				browserFromContext = this.browserContext.browser();
			}
			this.browser =
				browserFromContext && browserFromContext.isConnected() ? browserFromContext : this.browser;
		}
		const childPidsAfterLaunch = new Set(
			(await psList())
				.filter((p) => p.ppid === currentProcess)
				.map((h) => h.pid)
				.filter((pid) => typeof pid === 'number'),
		);
		const newChildPids = [...childPidsAfterLaunch].filter((pid) => !childPidsBeforeLaunch.has(pid));
		const newChildProcs = (await psList()).filter((p) => newChildPids.includes(p.pid));
		const newChromeProcs = newChildProcs.filter((p) => !p.name.includes('Helper'));
		if (newChromeProcs.length && !this.browserPid && !this.browserPid) {
			this.browserPid = newChromeProcs[0]!.pid;
			console.debug(` ↳ Spawned chrome subprocess: pid=${this.browserPid}`);
			this.browserProfile.keepAlive = false;
		}
		if (this.browser) {
			const connectionMethod = this.browserProfile.cdpUrl
				? 'CDP'
				: this.browserProfile.wssUrl
					? 'WSS'
					: 'Local';
			if (!this.browser.isConnected()) {
				throw new Error(
					`Browser is not connected, did the browser process crash or get killed? (connection method: ${connectionMethod})`,
				);
			}
			console.debug(`🌎 ${connectionMethod} Browser connected: v${this.browser.version()}`);
		}
		assert(this.browserContext);
		await this.browserContext.addInitScript(INIT_SCRIPT);
		// if (this.browserProfile.stealth && typeof chromium !== 'function') {
		// 	console.warn(
		// 		`⚠️ ${this} Failed to set up stealth mode. ${this}(...) got normal playwright objects as input.`,
		// 	);
		// }
	}

	/**
	 * Resize any existing page viewports to match the configured size and apply browser context settings.
	 */
	private async _setupViewportSizing(): Promise<void> {
		const vp = this.browserProfile.viewport;
		const win = this.browserProfile.windowSize;
		const scr = this.browserProfile.screen;
		const dpr = this.browserProfile.deviceScaleFactor || 1.0;
		const isMobile = this.browserProfile.isMobile;
		const colorScheme = this.browserProfile.colorScheme;
		const locale = this.browserProfile.locale;
		const timezoneId = this.browserProfile.timezoneId;
		const geolocation = this.browserProfile.geolocation;
		const permissions = this.browserProfile.permissions;
		const storageState = this.browserProfile.storageState;
		const headless = this.browserProfile.headless;

		// Log viewport info
		console.debug(
			`📐 [BrowserSession] Setting up viewport: ` +
				`headless=${headless} ` +
				(win ? `window=${win.width}x${win.height}px ` : '(no window) ') +
				(scr ? `screen=${scr.width}x${scr.height}px ` : '') +
				(vp ? `viewport=${vp.width}x${vp.height}px ` : '(no viewport) ') +
				`device_scale_factor=${dpr} ` +
				`is_mobile=${isMobile} ` +
				(colorScheme ? `color_scheme=${colorScheme} ` : '') +
				(locale ? `locale=${locale} ` : '') +
				(timezoneId ? `timezone_id=${timezoneId} ` : '') +
				(geolocation ? `geolocation=${JSON.stringify(geolocation)} ` : '') +
				(permissions ? `permissions=${permissions.join(',')}` : 'permissions=<none>') +
				` storage_state=${storageState || '<none>'}`,
		);

		// Permissions
		if (permissions && this.browserContext) {
			try {
				await this.browserContext.grantPermissions(permissions);
			} catch (e) {
				console.warn(
					`⚠️ Failed to grant browser permissions ${permissions}: ${e instanceof Error ? e.constructor.name : typeof e}: ${e}`,
				);
			}
		}

		// Timeouts
		try {
			this.browserContext?.setDefaultTimeout(this.browserProfile.defaultTimeout);
			this.browserContext?.setDefaultNavigationTimeout(
				this.browserProfile.defaultNavigationTimeout,
			);
		} catch (e) {
			console.warn(
				`⚠️ Failed to set playwright timeout settings: ${e instanceof Error ? e.constructor.name : typeof e}: ${e}`,
			);
		}

		// Extra HTTP headers
		try {
			if (this.browserProfile.extraHTTPHeaders && this.browserContext) {
				await this.browserContext.setExtraHTTPHeaders(this.browserProfile.extraHTTPHeaders);
			}
		} catch (e) {
			console.warn(
				`⚠️ Failed to setup playwright extraHTTPHeaders: ${e instanceof Error ? e.constructor.name : typeof e}: ${e}`,
			);
		}

		// Geolocation
		try {
			if (geolocation && this.browserContext) {
				await this.browserContext.setGeolocation(geolocation);
			}
		} catch (e) {
			console.warn(
				`⚠️ Failed to update browser geolocation ${JSON.stringify(geolocation)}: ${e instanceof Error ? e.constructor.name : typeof e}: ${e}`,
			);
		}

		await this.loadStorageState();

		// Apply viewport to all pages
		if (!this.browserContext) return;
		const pages = this.browserContext.pages();
		let lastPage: Page | null = null;
		for (const page of pages) {
			lastPage = page;
			if (vp) {
				await page.setViewportSize(vp);
			}

			if (page.url() === 'about:blank') {
				await this._showDvdScreensaverLoadingAnimation(page);
			}
		}
		// If no page, create one
		const page = lastPage || (await this.browserContext.newPage());

		// Resize window if needed
		if (!vp && win && !headless && page) {
			try {
				const cdpSession = await page.context().newCDPSession(page);
				const windowIdResult = await cdpSession.send('Browser.getWindowForTarget');
				await cdpSession.send('Browser.setWindowBounds', {
					windowId: windowIdResult.windowId,
					bounds: { ...win, windowState: 'normal' },
				});
				await cdpSession.detach();
			} catch (e) {
				try {
					await page.evaluate(({ width, height }) => {
						window.resizeTo(width, height);
					}, win);
					return;
				} catch {
					// fallback failed
				}
				console.warn(
					`⚠️ Failed to resize browser window to ${win.width}x${win.height}px using CDP setWindowBounds: ${e instanceof Error ? e.constructor.name : typeof e}: ${e}`,
				);
			}
		}
	}

	/**
	 * Set up listeners for foreground tab detection using visibility/focus/pointer events.
	 */
	private async _setupCurrentPageChangeListeners(): Promise<void> {
		if (!this.browserContext) return;
		const pages = this.browserContext.pages();
		const foregroundPage = pages.length ? pages[0] : await this.browserContext.newPage();
		this.agentCurrentPage = this.agentCurrentPage || foregroundPage;
		this.humanCurrentPage = this.humanCurrentPage || foregroundPage;

		// Callback to update humanCurrentPage
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const _BrowserUseonTabVisibilityChange = (source: Record<string, any>) => {
			const newPage = source['page'];
			const oldForeground = this.humanCurrentPage;
			if (!oldForeground || !this.browserContext) return;
			const allPages = this.browserContext.pages();
			const oldTabIdx = allPages.indexOf(oldForeground);
			this.humanCurrentPage = newPage;
			const newTabIdx = allPages.indexOf(newPage);
			const agentCurrentPage = this.agentCurrentPage;
			const agentTabIdx = agentCurrentPage ? allPages.indexOf(agentCurrentPage) : -1;
			const oldUrl = oldForeground.url();
			const newUrl = newPage.url();
			const agentUrl = agentCurrentPage?.url();
			if (oldUrl !== newUrl) {
				console.info(
					`👁️ Foreground tab changed by human from [${oldTabIdx}]${oldUrl} ` +
						`➡️ [${newTabIdx}]${newUrl} ` +
						`(agent will stay on [${agentTabIdx}]${agentUrl})`,
				);
			}
		};

		// Expose binding
		try {
			this.browserContext.exposeBinding(
				'_BrowserUseonTabVisibilityChange',
				_BrowserUseonTabVisibilityChange,
			);
			console.debug('expose_binding completed successfully');
		} catch (e) {
			const error = e as Error;
			if (typeof error.message === 'string' && error.message.includes('already registered')) {
				console.debug(
					'⚠️ Function "_BrowserUseonTabVisibilityChange" has been already registered, this is likely because the browser was already started with an existing BrowserSession()',
				);
			} else {
				throw error;
			}
		}

		// Script to inject
		const updateTabFocusScript = `
            document.addEventListener('visibilitychange', async () => {
                if (document.visibilityState === 'visible') {
                    await window._BrowserUseonTabVisibilityChange({ source: 'visibilitychange', url: document.location.href });
                    console.log('BrowserUse Foreground tab change event fired', document.location.href);
                }
            });
            window.addEventListener('focus', async () => {
                await window._BrowserUseonTabVisibilityChange({ source: 'focus', url: document.location.href });
                console.log('BrowserUse Foreground tab change event fired', document.location.href);
            });
            // let lastMove = 0;
            // window.addEventListener('pointermove', async () => {
            //     const now = Date.now();
            //     if (now - lastMove > 1000) {
            //         lastMove = now;
            //         await window._BrowserUseonTabVisibilityChange({ source: 'pointermove', url: document.location.href });
            //         console.log('BrowserUse Foreground tab change event fired', document.location.href);
            //     }
            // });
        `;
		await this.browserContext.addInitScript(updateTabFocusScript);
		for (const page of pages) {
			const url = page.url();
			if (url === 'about:blank') continue;
			try {
				await page.evaluate(new Function('return ' + updateTabFocusScript)());
				console.debug(`👁️ Added visibility listener to existing tab: ${url}`);
			} catch (e) {
				const pageIdx = pages.indexOf(page);
				console.debug(
					`⚠️ Failed to add visibility listener to existing tab, is it crashed or ignoring CDP commands?: [${pageIdx}]${url}: ${e instanceof Error ? e.constructor.name : typeof e}: ${e}`,
				);
			}
		}
	}

	/**
	 * Save storage state (cookies, localStorage, etc.) to a file.
	 */
	async saveStorageState(path?: string): Promise<void> {
		if (!this.browserContext) return;
		const storageState = await this.browserContext.storageState();
		if (path) {
			await writeFile(path, JSON.stringify(storageState, null, 4));
			console.info(`💾 Saved storage state to ${path}`);
			return;
		}
		if (typeof this.browserProfile.storageState === 'string') {
			await writeFile(this.browserProfile.storageState, JSON.stringify(storageState, null, 4));
			console.info(`💾 Saved storage state to ${this.browserProfile.storageState}`);
			return;
		}
		if (this.browserProfile.userDataDir) {
			await writeFile(
				join(this.browserProfile.userDataDir, 'storage_state.json'),
				JSON.stringify(storageState, null, 4),
			);
			console.info(
				`💾 Saved storage state to ${this.browserProfile.userDataDir}/storage_state.json`,
			);
			return;
		}
	}

	/**
	 * Load storage state from file and apply to context.
	 */
	async loadStorageState(path?: string): Promise<void> {
		if (!this.browserContext) return;
		let storagePath = path;
		if (!storagePath && typeof this.browserProfile.storageState === 'string') {
			storagePath = this.browserProfile.storageState;
		}
		if (storagePath) {
			try {
				const storageText = await readFile(storagePath, 'utf8');
				const storageState = JSON.parse(storageText);
				if (storageState.cookies) {
					await this.browserContext.addCookies(storageState.cookies);
					console.info(`🍪 Loaded ${storageState.cookies.length} cookies from ${storagePath}`);
				}
				if (storageState.localStorage) {
					await this.browserContext.addInitScript(
						`localStorage.clear(); localStorage.setItem('${storageState.localStorage.name}', '${storageState.localStorage.value}');`,
					);
					console.info(`💾 Loaded localStorage from ${storagePath}`);
				}
				if (storageState.sessionStorage) {
					await this.browserContext.addInitScript(
						`sessionStorage.clear(); sessionStorage.setItem('${storageState.sessionStorage.name}', '${storageState.sessionStorage.value}');`,
					);
					console.info(`💾 Loaded sessionStorage from ${storagePath}`);
				}
				return;
			} catch (e) {
				console.warn(`❌ Failed to load storage state from ${storagePath}: ${e}`);
			}
		}
	}

	private async _setupPlaywright() {
		if (this.browserProfile.stealth) {
			console.info('[Stealth] Using Patchright for browser automation.');
			if (this.browserProfile.channel && this.browserProfile.channel !== 'chrome') {
				console.warn('[Stealth] For maximum stealth, channel should be "chrome" or undefined.');
			}
			if (!this.browserProfile.userDataDir) {
				console.warn('[Stealth] For maximum stealth, you should use a persistent userDataDir.');
			}
			if (this.browserProfile.headless || this.browserProfile.viewport !== null) {
				console.warn('[Stealth] For maximum stealth, set headless=false and viewport=null.');
			}
		}
	}

	private async _showDvdScreensaverLoadingAnimation(page: Page) {
		const SCRIPT_JS = `() => {
			document.title = 'Setting up...';

			// Create the main overlay
			const loadingOverlay = document.createElement('div');
			loadingOverlay.id = 'pretty-loading-animation';
			loadingOverlay.style.position = 'fixed';
			loadingOverlay.style.top = '0';
			loadingOverlay.style.left = '0';
			loadingOverlay.style.width = '100vw';
			loadingOverlay.style.height = '100vh';
			loadingOverlay.style.background = '#000';
			loadingOverlay.style.zIndex = '99999';
			loadingOverlay.style.overflow = 'hidden';

			// Create the image element
			const img = document.createElement('img');
			img.src = 'https://github.com/browser-use.png';
			img.alt = 'Browser-Use';
			img.style.width = '200px';
			img.style.height = 'auto';
			img.style.position = 'absolute';
			img.style.left = '0px';
			img.style.top = '0px';
			img.style.zIndex = '2';
			img.style.opacity = '0.8';

			loadingOverlay.appendChild(img);
			document.body.appendChild(loadingOverlay);

			// DVD screensaver bounce logic
			let x = Math.random() * (window.innerWidth - 300);
			let y = Math.random() * (window.innerHeight - 300);
			let dx = 1.2 + Math.random() * 0.4; // px per frame
			let dy = 1.2 + Math.random() * 0.4;
			// Randomize direction
			if (Math.random() > 0.5) dx = -dx;
			if (Math.random() > 0.5) dy = -dy;

			function animate() {
				const imgWidth = img.offsetWidth || 300;
				const imgHeight = img.offsetHeight || 300;
				x += dx;
				y += dy;

				if (x <= 0) {
					x = 0;
					dx = Math.abs(dx);
				} else if (x + imgWidth >= window.innerWidth) {
					x = window.innerWidth - imgWidth;
					dx = -Math.abs(dx);
				}
				if (y <= 0) {
					y = 0;
					dy = Math.abs(dy);
				} else if (y + imgHeight >= window.innerHeight) {
					y = window.innerHeight - imgHeight;
					dy = -Math.abs(dy);
				}

				img.style.left = \`\${x}px\`;
				img.style.top = \`\${y}px\`;

				requestAnimationFrame(animate);
			}
			animate();

			// Responsive: update bounds on resize
			window.addEventListener('resize', () => {
				x = Math.min(x, window.innerWidth - img.offsetWidth);
				y = Math.min(y, window.innerHeight - img.offsetHeight);
			});

			// Add a little CSS for smoothness
			const style = document.createElement('style');
			style.innerHTML = \`
        #pretty - loading - animation {
            /*backdrop-filter: blur(2px) brightness(0.9);*/
        }
        #pretty - loading - animation img {
            user - select: none;
            pointer - events: none;
        }
			\`;
			document.head.appendChild(style);
		}`;
		await page.evaluate(new Function('return ' + SCRIPT_JS)());
	}
}

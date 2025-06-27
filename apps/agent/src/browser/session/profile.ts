// #region Python source reference: https://raw.githubusercontent.com/browser-use/browser-use/refs/heads/main/browser_use/browser/profile.py
// Last updated: 2025-05-21

import { join, resolve } from 'node:path';
import { mkdirSync, unlinkSync } from 'node:fs';
import {
	DEFAULT_CHANNEL,
	CHROME_DEFAULT_ARGS,
	CHROME_DISABLE_SECURITY_ARGS,
	CHROME_DETERMINISTIC_RENDERING_ARGS,
	CHROME_DOCKER_ARGS,
	CHROME_HEADLESS_ARGS,
	DEFAULT_VIEWPORT,
} from './const.js';
import { getDisplaySize, isDocker } from './utils.js';
import type { IBrowserProfile, LaunchPersistentContextOptions } from './interface.js';
import type {
	BrowserContextOptions,
	ConnectOptions,
	ConnectOverCDPOptions,
	LaunchOptions,
	Logger,
} from 'patchright';

function validateArgs(args?: Array<string>) {
	if (!args) return;
	if (args.some((arg) => !arg.startsWith('--'))) {
		throw new Error('Invalid arguments');
	}
	return args;
}

function validateTimeout(number: number) {
	if (number < 0) {
		return 0;
	}
	return Number(number);
}

function validateDeviceScaleFactor(number: number) {
	if (number <= 0) {
		return 0.01;
	}
	if (number > 1) {
		return 1;
	}
	return number;
}

export class BrowserProfile implements IBrowserProfile {
	private _args?: Array<string>;

	exposeNetwork?: string;
	slowMo?: number;
	timeout?: number;
	headers?: { [key: string]: string };
	logger?: Logger;
	headless?: boolean;
	ignoreDefaultArgs?: boolean | Array<string>;
	channel?: string;
	chromiumSandbox?: boolean;
	downloadsPath?: string;
	env?: IBrowserProfile['env'];
	executablePath?: string;
	firefoxUserPrefs?: IBrowserProfile['firefoxUserPrefs'];
	handleSIGHUP?: boolean;
	handleSIGINT?: boolean;
	handleSIGTERM?: boolean;
	proxy?: IBrowserProfile['proxy'];
	tracesDir?: string;
	acceptDownloads?: boolean;
	baseURL?: string;
	bypassCSP?: boolean;
	clientCertificates: IBrowserProfile['clientCertificates'];
	colorScheme?: 'light' | 'no-preference' | 'dark' | null;
	contrast?: 'no-preference' | 'more' | null;
	deviceScaleFactor?: number;
	extraHTTPHeaders?: { [key: string]: string };
	forcedColors?: 'active' | 'none' | null;
	geolocation?: IBrowserProfile['geolocation'];
	hasTouch?: boolean;
	httpCredentials?: IBrowserProfile['httpCredentials'];
	ignoreHTTPSErrors?: boolean;
	isMobile?: boolean;
	javaScriptEnabled?: boolean;
	locale?: string;
	offline?: boolean;
	permissions?: Array<string>;
	recordHar?: IBrowserProfile['recordHar'];
	recordVideo?: IBrowserProfile['recordVideo'];
	reducedMotion?: 'reduce' | 'no-preference' | null;
	screen?: IBrowserProfile['screen'];
	serviceWorkers?: 'allow' | 'block';
	strictSelectors?: boolean;
	timezoneId?: string;
	userAgent?: string;
	viewport?: null | IBrowserProfile['viewport'];
	storageState: IBrowserProfile['storageState'];

	// custom properties
	userDataDir?: string;
	profileDirectory: string;
	stealth: boolean = true;
	disableSecurity: boolean = false;
	deterministicRendering: boolean = false;
	blockedDomains?: string[];
	allowedDomains?: string[];
	keepAlive?: boolean;
	windowSize?: IBrowserProfile['windowSize'];
	windowPosition?: IBrowserProfile['windowPosition'];
	minimumWaitPageLoadTime: number = 0.25;
	waitForNetworkIdlePageLoadTime: number = 0.5;
	maximumWaitPageLoadTime: number = 5.0;
	includeDynamicAttributes: boolean = true;
	highlightElements: boolean = true;
	viewportExpansion: number = 500;
	defaultTimeout: number = 30_000;
	defaultNavigationTimeout: number = 30_000;

	wssUrl?: string;
	cdpUrl?: string;

	constructor(options?: IBrowserProfile) {
		this.timeout = 30_000;
		this.profileDirectory = 'Default';
		this.acceptDownloads = true;
		this.offline = false;
		this.strictSelectors = false;
		this.permissions = ['clipboard-read', 'clipboard-write', 'notifications'];
		this.bypassCSP = false;
		this.ignoreHTTPSErrors = false;
		this.javaScriptEnabled = true;
		this.serviceWorkers = 'allow';
		this.isMobile = false;
		this.hasTouch = false;
		this.colorScheme = 'light';
		this.contrast = 'no-preference';
		this.reducedMotion = 'no-preference';
		this.ignoreDefaultArgs = [
			'--enable-automation',
			'--disable-extensions',
			'--hide-scrollbars',
			'--disable-features=AcceptCHFrame,AutoExpandDetailsElement,AvoidUnnecessaryBeforeUnloadCheckSync,CertificateTransparencyComponentUpdater,DeferRendererTasksAfterInput,DestroyProfileOnBrowserClose,DialMediaRouteProvider,ExtensionManifestV2Disabled,GlobalMediaControls,HttpsUpgrades,ImprovedCookieControls,LazyFrameLoading,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate',
		];
		this.channel = DEFAULT_CHANNEL;
		this.handleSIGHUP = true;
		this.handleSIGINT = false;
		this.handleSIGTERM = false;
		const { args, ...rest } = options || {};
		this._args = validateArgs(args);
		if (this.timeout) this.timeout = validateTimeout(this.timeout);
		if (this.deviceScaleFactor)
			this.deviceScaleFactor = validateDeviceScaleFactor(this.deviceScaleFactor);
		Object.assign(this, rest);
		if (this.stealth) this.channel = DEFAULT_CHANNEL;
	}

	get args(): string[] {
		let defaultArgs = CHROME_DEFAULT_ARGS;
		if (Array.isArray(this.ignoreDefaultArgs))
			defaultArgs = CHROME_DEFAULT_ARGS.filter(
				(arg) => !(this.ignoreDefaultArgs as string[]).includes(arg),
			);
		else if (this.ignoreDefaultArgs === true) defaultArgs = [];
		return [
			...defaultArgs,
			...(this._args || []),
			`--profile-directory=${this.profileDirectory}`,
			...(isDocker() ? CHROME_DOCKER_ARGS : []),
			...(this.headless ? CHROME_HEADLESS_ARGS : []),
			...(this.disableSecurity ? CHROME_DISABLE_SECURITY_ARGS : []),
			...(this.deterministicRendering ? CHROME_DETERMINISTIC_RENDERING_ARGS : []),
			...(this.windowSize
				? [`--window-size=${this.windowSize.width},${this.windowSize.height}`]
				: []),
			...(this.windowPosition
				? [`--window-position=${this.windowPosition.width},${this.windowPosition.height}`]
				: []),
			...(this.headless ? ['--start-maximized'] : []),
		];
	}

	prepareUserDataDir() {
		if (this.userDataDir) {
			this.userDataDir = resolve(this.userDataDir);
			mkdirSync(this.userDataDir, { recursive: true });
			try {
				const singletonLock = join(this.userDataDir, 'SingletonLock');
				unlinkSync(singletonLock);
			} catch {}
		}
		if (this.downloadsPath) {
			this.downloadsPath = resolve(this.downloadsPath);
			mkdirSync(this.downloadsPath, { recursive: true });
		}
		if (this.tracesDir) {
			this.tracesDir = resolve(this.tracesDir);
			mkdirSync(this.tracesDir, { recursive: true });
		}
	}

	detectDisplayConfiguration() {
		const displaySize = getDisplaySize();
		const hasScreenAvailable = !!displaySize;
		if (displaySize) this.screen = this.screen || displaySize || DEFAULT_VIEWPORT;
		if (this.headless === undefined) this.headless = !hasScreenAvailable;
		if (this.headless) {
			this.viewport =
				this.viewport === null ? this.viewport : this.windowSize || this.screen || DEFAULT_VIEWPORT;
			this.windowPosition = undefined;
			this.windowSize = undefined;
		} else {
			this.windowSize = this.windowSize || this.screen;
			this.viewport = null;
		}
		const useViewport =
			this.viewport === null ? false : !!(this.headless || this.viewport || this.deviceScaleFactor);
		if (useViewport) {
			this.viewport = this.viewport || this.screen;
			this.deviceScaleFactor = this.deviceScaleFactor || 1.0;
			if (!this.viewport) throw new Error('Viewport must be set when using viewport mode');
		} else {
			this.viewport = null;
			this.deviceScaleFactor = undefined;
			this.screen = undefined;
		}
		if (this.headless && this.viewport === null)
			throw new Error(
				'headless=true and viewport=null (no viewport) cannot both be set at the same time',
			);
	}

	toConnectOptions(): ConnectOptions {
		return {
			exposeNetwork: this.exposeNetwork,
			...this.toConnectOverCDPOptions(),
		};
	}

	toConnectOverCDPOptions(): ConnectOverCDPOptions {
		return {
			headers: this.headers,
			logger: this.logger,
			slowMo: this.slowMo,
			timeout: this.timeout,
		};
	}

	toLaunchOptions(): LaunchOptions {
		return {
			args: this.args,
			channel: this.channel,
			chromiumSandbox: this.chromiumSandbox,
			downloadsPath: this.downloadsPath,
			env: this.env,
			executablePath: this.executablePath,
			firefoxUserPrefs: this.firefoxUserPrefs,
			handleSIGHUP: this.handleSIGHUP,
			handleSIGINT: this.handleSIGINT,
			handleSIGTERM: this.handleSIGTERM,
			headless: this.headless,
			ignoreDefaultArgs: this.ignoreDefaultArgs,
			logger: this.logger,
			proxy: this.proxy,
			slowMo: this.slowMo,
			timeout: this.timeout,
			tracesDir: this.tracesDir,
		};
	}

	toBrowserContextOptions(): BrowserContextOptions {
		return {
			acceptDownloads: this.acceptDownloads,
			baseURL: this.baseURL,
			bypassCSP: this.bypassCSP,
			clientCertificates: this.clientCertificates,
			colorScheme: this.colorScheme,
			contrast: this.contrast,
			deviceScaleFactor: this.deviceScaleFactor,
			extraHTTPHeaders: this.extraHTTPHeaders,
			forcedColors: this.forcedColors,
			geolocation: this.geolocation,
			hasTouch: this.hasTouch,
			httpCredentials: this.httpCredentials,
			ignoreHTTPSErrors: this.ignoreHTTPSErrors,
			isMobile: this.isMobile,
			javaScriptEnabled: this.javaScriptEnabled,
			locale: this.locale,
			offline: this.offline,
			permissions: this.permissions,
			proxy: this.proxy,
			recordHar: this.recordHar,
			recordVideo: this.recordVideo,
			reducedMotion: this.reducedMotion,
			screen: this.screen,
			serviceWorkers: this.serviceWorkers,
			strictSelectors: this.strictSelectors,
			timezoneId: this.timezoneId,
			userAgent: this.userAgent,
			viewport: this.viewport,
		};
	}

	toLaunchPersistentContextOptions(): LaunchPersistentContextOptions {
		return {
			...this.toLaunchOptions(),
			acceptDownloads: this.acceptDownloads,
			baseURL: this.baseURL,
			bypassCSP: this.bypassCSP,
			clientCertificates: this.clientCertificates,
			colorScheme: this.colorScheme,
			contrast: this.contrast,
			deviceScaleFactor: this.deviceScaleFactor,
			extraHTTPHeaders: this.extraHTTPHeaders,
			forcedColors: this.forcedColors,
			geolocation: this.geolocation,
			hasTouch: this.hasTouch,
			httpCredentials: this.httpCredentials,
			ignoreHTTPSErrors: this.ignoreHTTPSErrors,
			isMobile: this.isMobile,
			javaScriptEnabled: this.javaScriptEnabled,
			locale: this.locale,
			offline: this.offline,
			permissions: this.permissions,
			recordHar: this.recordHar,
			recordVideo: this.recordVideo,
			reducedMotion: this.reducedMotion,
			screen: this.screen,
			serviceWorkers: this.serviceWorkers,
			strictSelectors: this.strictSelectors,
			timezoneId: this.timezoneId,
			userAgent: this.userAgent,
			viewport: this.viewport,
		};
	}
}

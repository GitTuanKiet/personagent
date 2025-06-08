import os from 'node:os';
import { execSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { mkdirSync, unlinkSync } from 'node:fs';
import type {
	LaunchOptions,
	Geolocation,
	ViewportSize,
	BrowserContextOptions,
	ConnectOptions,
	ConnectOverCDPOptions,
	HTTPCredentials,
} from 'playwright';
import { singleton } from './di';
import {
	BUA_DEFAULT_CHANNEL,
	BUA_DEFAULT_PROFILE_DIR,
	CHROME_DEFAULT_ARGS,
	CHROME_DISABLE_SECURITY_ARGS,
	CHROME_DETERMINISTIC_RENDERING_ARGS,
	IN_DOCKER,
	CHROME_DOCKER_ARGS,
	CHROME_HEADLESS_ARGS,
} from './consts';

export interface BrowserProfileOptions
	extends ConnectOptions,
		ConnectOverCDPOptions,
		LaunchOptions,
		BrowserContextOptions,
		LaunchPersistentContextOptions {
	userDataDir?: string;
	cookiesFile?: string;
	profileDirectory?: string;
	stealth?: boolean;
	disableSecurity?: boolean;
	deterministicRendering?: boolean;
	blockedDomains?: string[];
	keepAlive?: boolean;
	windowSize?: ViewportSize;
	windowPosition?: ViewportSize;
	minimumWaitPageLoadTime?: number;
	waitForNetworkIdlePageLoadTime?: number;
	maximumWaitPageLoadTime?: number;
	waitBetweenActions?: number;
	includeDynamicAttributes?: boolean;
	highlightElements?: boolean;
	viewportExpansion?: number;
	defaultTimeout?: number;
	defaultNavigationTimeout?: number;
}

const DEFAULT_VIEWPORT: ViewportSize = { width: 1280, height: 720 };
let cachedDisplaySize: ViewportSize | null = null;
function getDisplaySize(): ViewportSize | null {
	if (cachedDisplaySize) return cachedDisplaySize;
	const platform = os.platform();
	try {
		if (platform === 'win32') {
			try {
				const out = execSync(
					'wmic path Win32_VideoController get CurrentHorizontalResolution,CurrentVerticalResolution',
				)
					.toString()
					.split('\n')
					.find((line) => /\d+/.test(line));
				if (out) {
					const [width, height] = out.trim().split(/\s+/).map(Number);
					if (width && height) cachedDisplaySize = { width, height };
				}
			} catch {}
		} else if (platform === 'darwin') {
			const out = execSync('system_profiler SPDisplaysDataType')
				.toString()
				.match(/Resolution: (\d+) x (\d+)/);
			if (out) {
				const [, width, height] = out;
				if (width && height) cachedDisplaySize = { width: +width, height: +height };
			}
		} else if (platform === 'linux') {
			try {
				execSync('which xrandr');
			} catch {
				return null;
			}
			if (!process.env.DISPLAY) return null;
			const out = execSync("xrandr | grep '*' | awk '{print $1}'", { timeout: 3000 }).toString();
			const match = out.match(/(\d+)x(\d+)/);
			if (match) {
				const [, width, height] = match;
				if (width && height) cachedDisplaySize = { width: +width, height: +height };
			}
		}
	} catch {}

	if (cachedDisplaySize && cachedDisplaySize.width > 1920) {
		cachedDisplaySize = DEFAULT_VIEWPORT;
	}

	return cachedDisplaySize;
}

@singleton()
export class BrowserProfile implements BrowserProfileOptions {
	slowMo?: number;
	timeout?: number;
	args?: Array<string>;
	headless?: boolean;
	ignoreDefaultArgs?: boolean | Array<string>;
	channel?: string;
	chromiumSandbox?: boolean;
	downloadsPath?: string;
	env?: { [key: string]: string | number | boolean };
	executablePath?: string;
	handleSIGHUP?: boolean;
	handleSIGINT?: boolean;
	handleSIGTERM?: boolean;
	proxy?: BrowserContextOptions['proxy'];
	tracesDir?: string;
	acceptDownloads?: boolean;
	baseURL?: string;
	bypassCSP?: boolean;
	clientCertificates: BrowserContextOptions['clientCertificates'];
	colorScheme?: 'light' | 'no-preference' | 'dark' | null;
	contrast?: 'no-preference' | 'more' | null;
	deviceScaleFactor?: number;
	extraHTTPHeaders?: { [key: string]: string };
	forcedColors?: 'active' | 'none' | null;
	geolocation?: Geolocation;
	hasTouch?: boolean;
	httpCredentials?: HTTPCredentials;
	ignoreHTTPSErrors?: boolean;
	isMobile?: boolean;
	javaScriptEnabled?: boolean;
	locale?: string;
	offline?: boolean;
	permissions?: Array<string>;
	recordHar?: any;
	recordVideo?: any;
	reducedMotion?: 'reduce' | 'no-preference' | null;
	screen?: ViewportSize;
	serviceWorkers?: 'allow' | 'block';
	strictSelectors?: boolean;
	timezoneId?: string;
	userAgent?: string;
	viewport?: null | ViewportSize;
	storageState: BrowserContextOptions['storageState'];

	// custom properties
	userDataDir: string;
	cookiesFile?: string;
	profileDirectory: string;
	stealth: boolean = false;
	disableSecurity: boolean = false;
	deterministicRendering: boolean = false;
	blockedDomains?: string[];
	keepAlive?: boolean;
	windowSize?: ViewportSize;
	windowPosition?: ViewportSize;
	minimumWaitPageLoadTime: number = 0.25;
	waitForNetworkIdlePageLoadTime: number = 0.5;
	maximumWaitPageLoadTime: number = 5.0;
	waitBetweenActions: number = 0.5;
	includeDynamicAttributes: boolean = true;
	highlightElements: boolean = true;
	viewportExpansion: number = 500;
	defaultTimeout: number = 30000;
	defaultNavigationTimeout: number = 30000;

	constructor(options?: BrowserProfileOptions) {
		this.userDataDir = BUA_DEFAULT_PROFILE_DIR;
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
		this.recordHar = {
			content: 'embed',
			mode: 'full',
			omitContent: false,
			path: join(this.userDataDir, 'har.json'),
		};
		this.slowMo = 0;
		this.timeout = 30000;
		this.ignoreDefaultArgs = [
			'--enable-automation',
			'--disable-extensions',
			'--hide-scrollbars',
			'--disable-features=AcceptCHFrame,AutoExpandDetailsElement,AvoidUnnecessaryBeforeUnloadCheckSync,CertificateTransparencyComponentUpdater,DeferRendererTasksAfterInput,DestroyProfileOnBrowserClose,DialMediaRouteProvider,ExtensionManifestV2Disabled,GlobalMediaControls,HttpsUpgrades,ImprovedCookieControls,LazyFrameLoading,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate',
		];
		this.channel = BUA_DEFAULT_CHANNEL;
		this.chromiumSandbox = !IN_DOCKER;
		this.handleSIGHUP = true;
		this.handleSIGINT = false;
		this.handleSIGTERM = false;
		if (options) this.setProfile(options);
	}

	setProfile(options: Partial<BrowserProfileOptions>): BrowserProfileOptions {
		Object.assign(this, options);
		if (options.userDataDir) this.prepareUserDataDir();
		this.detectDisplayConfiguration();
		return { ...this };
	}

	getArgs(): string[] {
		let defaultArgs = CHROME_DEFAULT_ARGS;
		if (Array.isArray(this.ignoreDefaultArgs))
			defaultArgs = CHROME_DEFAULT_ARGS.filter(
				(arg) => !(this.ignoreDefaultArgs as string[]).includes(arg),
			);
		else if (this.ignoreDefaultArgs === true) defaultArgs = [];
		return [
			...defaultArgs,
			...(this.args || []),
			`--profile-directory=${this.profileDirectory}`,
			...(IN_DOCKER ? CHROME_DOCKER_ARGS : []),
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
			this.viewport = this.viewport || this.windowSize || this.screen;
			this.windowPosition = undefined;
			this.windowSize = undefined;
		} else {
			this.windowSize = this.windowSize || this.screen;
			if (this.viewport === undefined) this.viewport = null;
		}
		const useViewport = this.headless || !!this.viewport || !!this.deviceScaleFactor;
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
		return { ...this };
	}

	toConnectOverCDPOptions(): ConnectOverCDPOptions {
		return { ...this };
	}

	toLaunchOptions(): LaunchOptions {
		return { ...this };
	}

	toBrowserContextOptions(): BrowserContextOptions {
		return { ...this };
	}

	toLaunchPersistentContextOptions(): LaunchPersistentContextOptions {
		return { ...this };
	}
}

interface LaunchPersistentContextOptions extends LaunchOptions {
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

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './mcp.js';
import { getUserDataDir } from './utils.js';
import { browserContainer, BrowserManager } from '@pag/browser-manager';
import { z } from 'zod';

const viewportSizeSchema = z
	.string()
	.regex(/^[0-9]+x[0-9]+$/)
	.transform((val) => {
		const [width, height] = val.split('x').map(Number);
		if (Number.isFinite(width) && Number.isFinite(height)) {
			return { width: width as number, height: height as number };
		}
		return undefined;
	})
	.refine((v) => v === undefined || (typeof v.width === 'number' && typeof v.height === 'number'), {
		message: 'Invalid viewport size',
	});

const parseEnvSchema = z.object({
	headless: z.preprocess((v) => v === 'true' || v === '1', z.boolean().optional()),
	profileDirectory: z.string().optional(),
	stealth: z.preprocess((v) => v === 'true' || v === '1', z.boolean().optional()),
	disableSecurity: z.preprocess((v) => v === 'true' || v === '1', z.boolean().optional()),
	deterministicRendering: z.preprocess((v) => v === 'true' || v === '1', z.boolean().optional()),
	blockedDomains: z.preprocess(
		(v) =>
			typeof v === 'string'
				? v
						.split(',')
						.map((s) => s.trim())
						.filter(Boolean)
				: undefined,
		z.string().array().optional(),
	),
	allowedDomains: z.preprocess(
		(v) =>
			typeof v === 'string'
				? v
						.split(',')
						.map((s) => s.trim())
						.filter(Boolean)
				: undefined,
		z.string().array().optional(),
	),
	keepAlive: z.preprocess((v) => v === 'true' || v === '1', z.boolean().optional()),
	windowSize: z
		.preprocess((v) => (typeof v === 'string' ? v : undefined), viewportSizeSchema.optional())
		.transform((v) => (v === undefined ? undefined : { width: v.width, height: v.height })),
	windowPosition: z
		.preprocess((v) => (typeof v === 'string' ? v : undefined), viewportSizeSchema.optional())
		.transform((v) => (v === undefined ? undefined : { width: v.width, height: v.height })),
	minimumWaitPageLoadTime: z.preprocess(
		(v) => (v === undefined ? undefined : Number(v)),
		z.number().optional(),
	),
	waitForNetworkIdlePageLoadTime: z.preprocess(
		(v) => (v === undefined ? undefined : Number(v)),
		z.number().optional(),
	),
	maximumWaitPageLoadTime: z.preprocess(
		(v) => (v === undefined ? undefined : Number(v)),
		z.number().optional(),
	),
	includeDynamicAttributes: z.preprocess((v) => v === 'true' || v === '1', z.boolean().optional()),
	highlightElements: z.preprocess((v) => v === 'true' || v === '1', z.boolean().optional()),
	viewportExpansion: z.preprocess(
		(v) => (v === undefined ? undefined : Number(v)),
		z.number().optional(),
	),
	defaultTimeout: z.preprocess(
		(v) => (v === undefined ? undefined : Number(v)),
		z.number().optional(),
	),
	defaultNavigationTimeout: z.preprocess(
		(v) => (v === undefined ? undefined : Number(v)),
		z.number().optional(),
	),
	wssUrl: z.string().optional(),
	cdpUrl: z.string().optional(),
	acceptDownloads: z.preprocess((v) => v === 'true' || v === '1', z.boolean().optional()),
	baseURL: z.string().optional(),
	bypassCSP: z.preprocess((v) => v === 'true' || v === '1', z.boolean().optional()),
	colorScheme: z.enum(['light', 'dark', 'no-preference']).nullable().optional(),
	deviceScaleFactor: z.preprocess(
		(v) => (v === undefined ? undefined : Number(v)),
		z.number().optional(),
	),
	extraHTTPHeaders: z.preprocess(
		(v) => (typeof v === 'string' ? JSON.parse(v) : undefined),
		z.record(z.string()).optional(),
	),
	geolocation: z.preprocess(
		(v) => (typeof v === 'string' ? JSON.parse(v) : undefined),
		z.any().optional(),
	),
	hasTouch: z.preprocess((v) => v === 'true' || v === '1', z.boolean().optional()),
	httpCredentials: z.preprocess(
		(v) => (typeof v === 'string' ? JSON.parse(v) : undefined),
		z.any().optional(),
	),
	ignoreHTTPSErrors: z.preprocess((v) => v === 'true' || v === '1', z.boolean().optional()),
	isMobile: z.preprocess((v) => v === 'true' || v === '1', z.boolean().optional()),
	javaScriptEnabled: z.preprocess((v) => v === 'true' || v === '1', z.boolean().optional()),
	locale: z.string().optional(),
	offline: z.preprocess((v) => v === 'true' || v === '1', z.boolean().optional()),
	permissions: z.preprocess(
		(v) =>
			typeof v === 'string'
				? v
						.split(',')
						.map((s) => s.trim())
						.filter(Boolean)
				: undefined,
		z.string().array().optional(),
	),
	recordHar: z.preprocess(
		(v) => (typeof v === 'string' ? JSON.parse(v) : undefined),
		z.any().optional(),
	),
	recordVideo: z.preprocess(
		(v) => (typeof v === 'string' ? JSON.parse(v) : undefined),
		z.any().optional(),
	),
	reducedMotion: z.enum(['reduce', 'no-preference']).nullable().optional(),
	screen: z
		.preprocess((v) => (typeof v === 'string' ? v : undefined), viewportSizeSchema.optional())
		.transform((v) => (v === undefined ? undefined : { width: v.width, height: v.height })),
	serviceWorkers: z.enum(['allow', 'block']).optional(),
	strictSelectors: z.preprocess((v) => v === 'true' || v === '1', z.boolean().optional()),
	timezoneId: z.string().optional(),
	userAgent: z.string().optional(),
	viewport: z
		.preprocess((v) => (typeof v === 'string' ? v : undefined), viewportSizeSchema.optional())
		.transform((v) => (v === undefined ? undefined : { width: v.width, height: v.height })),
});

function parseEnv() {
	return parseEnvSchema.parse({
		headless: process.env.HEADLESS,
		profileDirectory: process.env.PROFILE_DIRECTORY,
		stealth: process.env.STEALTH,
		disableSecurity: process.env.DISABLE_SECURITY,
		deterministicRendering: process.env.DETERMINISTIC_RENDERING,
		blockedDomains: process.env.BLOCKED_DOMAINS,
		allowedDomains: process.env.ALLOWED_DOMAINS,
		keepAlive: process.env.KEEP_ALIVE,
		windowSize: process.env.WINDOW_SIZE,
		windowPosition: process.env.WINDOW_POSITION,
		minimumWaitPageLoadTime: process.env.MIN_WAIT_PAGE_LOAD,
		waitForNetworkIdlePageLoadTime: process.env.NETWORK_IDLE_WAIT,
		maximumWaitPageLoadTime: process.env.MAX_WAIT_PAGE_LOAD,
		includeDynamicAttributes: process.env.INCLUDE_DYNAMIC_ATTRS,
		highlightElements: process.env.HIGHLIGHT_ELEMENTS,
		viewportExpansion: process.env.VIEWPORT_EXPANSION,
		defaultTimeout: process.env.DEFAULT_TIMEOUT,
		defaultNavigationTimeout: process.env.DEFAULT_NAV_TIMEOUT,
		wssUrl: process.env.WSS_URL,
		cdpUrl: process.env.CDP_URL,
		acceptDownloads: process.env.ACCEPT_DOWNLOADS,
		baseURL: process.env.BASE_URL,
		bypassCSP: process.env.BYPASS_CSP,
		colorScheme: process.env.COLOR_SCHEME ?? undefined,
		deviceScaleFactor: process.env.DEVICE_SCALE_FACTOR,
		extraHTTPHeaders: process.env.EXTRA_HTTP_HEADERS,
		geolocation: process.env.GEOLOCATION,
		hasTouch: process.env.HAS_TOUCH,
		httpCredentials: process.env.HTTP_CREDENTIALS,
		ignoreHTTPSErrors: process.env.IGNORE_HTTPS_ERRORS,
		isMobile: process.env.IS_MOBILE,
		javaScriptEnabled: process.env.JS_ENABLED ?? '1',
		locale: process.env.LOCALE,
		offline: process.env.OFFLINE,
		permissions: process.env.PERMISSIONS,
		recordHar: process.env.RECORD_HAR,
		recordVideo: process.env.RECORD_VIDEO,
		reducedMotion: process.env.REDUCED_MOTION ?? undefined,
		screen: process.env.SCREEN,
		serviceWorkers: process.env.SERVICE_WORKERS ?? undefined,
		strictSelectors: process.env.STRICT_SELECTORS,
		timezoneId: process.env.TIMEZONE_ID,
		userAgent: process.env.USER_AGENT,
		viewport: process.env.VIEWPORT,
	});
}

async function main() {
	// Get browser manager instance
	const browserManager = browserContainer.get(BrowserManager);

	const sessionId = process.env.USER || 'default';

	// Create a new browser session
	const instance = await browserManager.getOrCreateSession({
		sessionId,
		browserProfile: {
			...parseEnv(),
			userDataDir: getUserDataDir(),
		},
	});

	const server = createMcpServer(instance);
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error('MCP Server for patchright started');

	// Cleanup on exit
	process.on('SIGINT', async () => {
		await browserManager.closeSession(sessionId);
		process.exit(0);
	});
}

main().catch((error) => {
	console.error('Server error:', error);
	process.exit(1);
});

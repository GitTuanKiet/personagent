import { join } from 'node:path';

const homeVarName = process.platform === 'win32' ? 'USERPROFILE' : 'HOME';
export const BUA_CONFIG_DIR = join(process.env[homeVarName] ?? process.cwd(), '.bua');
export const BUA_PROFILES_DIR = join(BUA_CONFIG_DIR, 'profiles');
export const BUA_DEFAULT_PROFILE_DIR = join(BUA_PROFILES_DIR, 'Default');
export const BUA_DEFAULT_CHANNEL = 'chromium';

export const INIT_SCRIPT = `
// check to make sure we're not inside the PDF viewer
window.isPdfViewer = !!document?.body?.querySelector('body > embed[type="application/pdf"][width="100%"]')
if (!window.isPdfViewer) {

  // Permissions
  const originalQuery = window.navigator.permissions.query;
  window.navigator.permissions.query = (parameters) => (
    parameters.name === 'notifications' ?
      Promise.resolve({ state: Notification.permission }) :
      originalQuery(parameters)
  );
  (() => {
    if (window._eventListenerTrackerInitialized) return;
    window._eventListenerTrackerInitialized = true;

    const originalAddEventListener = EventTarget.prototype.addEventListener;
    const eventListenersMap = new WeakMap();

    EventTarget.prototype.addEventListener = function (type, listener, options) {
      if (typeof listener === "function") {
        let listeners = eventListenersMap.get(this);
        if (!listeners) {
          listeners = [];
          eventListenersMap.set(this, listeners);
        }

        listeners.push({
          type,
          listener,
          listenerPreview: listener.toString().slice(0, 100),
          options
        });
      }

      return originalAddEventListener.call(this, type, listener, options);
    };

    window.getEventListenersForNode = (node) => {
      const listeners = eventListenersMap.get(node) || [];
      return listeners.map(({ type, listenerPreview, options }) => ({
        type,
        listenerPreview,
        options
      }));
    };
  })();
}
`;

export const SMART_SCROLL_JS = `(dy) => {
    const bigEnough = el => el.clientHeight >= window.innerHeight * 0.5;
    const canScroll = el =>
        el &&
        /(auto|scroll|overlay)/.test(getComputedStyle(el).overflowY) &&
        el.scrollHeight > el.clientHeight &&
        bigEnough(el);

    let el = document.activeElement;
    while (el && !canScroll(el) && el !== document.body) el = el.parentElement;

    el = canScroll(el)
            ? el
            : [...document.querySelectorAll('*')].find(canScroll)
            || document.scrollingElement
            || document.documentElement;

    if (el === document.scrollingElement ||
        el === document.documentElement ||
        el === document.body) {
        window.scrollBy(0, dy);
    } else {
        el.scrollBy({ top: dy, behavior: 'auto' });
    }
}`;

export const PAGE_STRUCTURE_JS = `(() => {
    function getPageStructure(element = document, depth = 0, maxDepth = 10) {
      if (depth >= maxDepth) return '';

      const indent = '  '.repeat(depth);
      let structure = '';

      const skipTags = new Set(['script', 'style', 'link', 'meta', 'noscript']);

      if (element !== document) {
        const tagName = element.tagName.toLowerCase();

        if (skipTags.has(tagName)) return '';

        const id = element.id ? \`//\${element.id}\` : '';
        const classes = element.className && typeof element.className === 'string'
          ? \`.\${element.className.split(' ').filter(c => c).join('.')}\`
          : '';

        const attrs = [];
        if (element.getAttribute('role')) attrs.push(\`role="\${element.getAttribute('role')}"\`);
        if (element.getAttribute('aria-label')) attrs.push(\`aria-label="\${element.getAttribute('aria-label')}"\`);
        if (element.getAttribute('type')) attrs.push(\`type="\${element.getAttribute('type')}"\`);
        if (element.getAttribute('name')) attrs.push(\`name="\${element.getAttribute('name')}"\`);
        if (element.getAttribute('src')) {
          const src = element.getAttribute('src');
          attrs.push(\`src="\${src.substring(0, 50)}\${src.length > 50 ? '...' : ''}"\`);
        }

        structure += \`\${indent}\${tagName}\${id}\${classes}\${attrs.length ? ' [' + attrs.join(', ') + ']' : ''}\\n\`;

        if (tagName === 'iframe') {
          try {
            const iframeDoc = element.contentDocument || element.contentWindow?.document;
            if (iframeDoc) {
              structure += \`\${indent}  [IFRAME CONTENT]:\\n\`;
              structure += getPageStructure(iframeDoc, depth + 2, maxDepth);
            } else {
              structure += \`\${indent}  [IFRAME: No access - likely cross-origin]\\n\`;
            }
          } catch (e) {
            structure += \`\${indent}  [IFRAME: Access denied - \${e.message}]\\n\`;
          }
        }
      }

      const children = element.children || element.childNodes;
      for (const child of children) {
        if (child.nodeType === 1) {
          structure += getPageStructure(child, depth + 1, maxDepth);
        }
      }

      return structure;
    }

    return getPageStructure();
  })();`;

export const IN_DOCKER = process.env.IN_DOCKER === 'true';
export const CHROME_DEBUG_PORT = 9242; // use a non -default port to avoid conflicts with other tools / devs using 9222
export const CHROME_DISABLED_COMPONENTS = [
	// Playwright defaults: https://github.com/microsoft/playwright/blob/41008eeddd020e2dee1c540f7c0cdfa337e99637/packages/playwright-core/src/server/chromium/chromiumSwitches.ts//L76
	// AcceptCHFrame, AutoExpandDetailsElement, AvoidUnnecessaryBeforeUnloadCheckSync, CertificateTransparencyComponentUpdater, DeferRendererTasksAfterInput, DestroyProfileOnBrowserClose, DialMediaRouteProvider, ExtensionManifestV2Disabled, GlobalMediaControls, HttpsUpgrades, ImprovedCookieControls, LazyFrameLoading, LensOverlay, MediaRouter, PaintHolding, ThirdPartyStoragePartitioning, Translate
	// See https: //github.com / microsoft / playwright / pull / 10380
	'AcceptCHFrame',
	// See https: //github.com / microsoft / playwright / pull / 10679
	'AutoExpandDetailsElement',
	// See https: //github.com / microsoft / playwright / issues / 14047
	'AvoidUnnecessaryBeforeUnloadCheckSync',
	// See https: //github.com / microsoft / playwright / pull / 12992
	'CertificateTransparencyComponentUpdater',
	'DestroyProfileOnBrowserClose',
	// See https: //github.com / microsoft / playwright / pull / 13854
	'DialMediaRouteProvider',
	// Chromium is disabling manifest version 2. Allow testing it as long as Chromium can actually run it.
	// Disabled in https: //chromium - review.googlesource.com / c / chromium / src / +/6265903.
	'ExtensionManifestV2Disabled',
	'GlobalMediaControls',
	// See https: //github.com / microsoft / playwright / pull / 27605
	'HttpsUpgrades',
	'ImprovedCookieControls',
	'LazyFrameLoading',
	// Hides the Lens feature in the URL address bar.Its not working in unofficial builds.
	'LensOverlay',
	// See https: //github.com / microsoft / playwright / pull / 8162
	'MediaRouter',
	// See https: //github.com / microsoft / playwright / issues / 28023
	'PaintHolding',
	// See https: //github.com / microsoft / playwright / issues / 32230
	'ThirdPartyStoragePartitioning',
	// See https://github.com/microsoft/playwright/issues/16126
	'Translate',
	//////////////////////////////////////////////////////3
	// Added by us:
	'AutomationControlled',
	'BackForwardCache',
	'OptimizationHints',
	'ProcessPerSiteUpToMainFrameThreshold',
	'InterestFeedContentSuggestions',
	'CalculateNativeWinOcclusion', // chrome normally stops rendering tabs if they are not visible(occluded by a foreground window or other app)
	// 'BackForwardCache',  // agent does actually use back / forward navigation, but we can disable if we ever remove that
	'HeavyAdPrivacyMitigations',
	'PrivacySandboxSettings4',
	'AutofillServerCommunication',
	'CrashReporting',
	'OverscrollHistoryNavigation',
	'InfiniteSessionRestore',
	'ExtensionDisableUnsupportedDeveloper',
];

export const CHROME_HEADLESS_ARGS = ['--headless=new'];

export const CHROME_DOCKER_ARGS = [
	'--no-sandbox',
	'--disable-gpu-sandbox',
	'--disable-setuid-sandbox',
	'--disable-dev-shm-usage',
	'--no-xshm',
	'--no-zygote',
	'--single-process',
];

export const CHROME_DISABLE_SECURITY_ARGS = [
	'--disable-web-security',
	'--disable-site-isolation-trials',
	'--disable-features=IsolateOrigins,site-per-process',
	'--allow-running-insecure-content',
	'--ignore-certificate-errors',
	'--ignore-ssl-errors',
	'--ignore-certificate-errors-spki-list',
];

export const CHROME_DETERMINISTIC_RENDERING_ARGS = [
	'--deterministic-mode',
	'--js-flags=--random-seed=1157259159',
	'--force-device-scale-factor=2',
	'--enable-webgl',
	// '--disable-skia-runtime-opts',
	// '--disable-2d-canvas-clip-aa',
	'--font-render-hinting=none',
	'--force-color-profile=srgb',
];

export const CHROME_DEFAULT_ARGS = [
	// // provided by playwright by default: https://github.com/microsoft/playwright/blob/41008eeddd020e2dee1c540f7c0cdfa337e99637/packages/playwright-core/src/server/chromium/chromiumSwitches.ts//L76
	// // we don't need to include them twice in our own config, but it's harmless
	// '--disable-field-trial-config',  // https://source.chromium.org/chromium/chromium/src/+/main:testing/variations/README.md
	// '--disable-background-networking',
	// '--disable-background-timer-throttling',  // agents might be working on background pages if the human switches to another tab
	// '--disable-backgrounding-occluded-windows',  // same deal, agents are often working on backgrounded browser windows
	// '--disable-back-forward-cache',  // Avoids surprises like main request not being intercepted during page.goBack().
	// '--disable-breakpad',
	// '--disable-client-side-phishing-detection',
	// '--disable-component-extensions-with-background-pages',
	// '--disable-component-update',  // Avoids unneeded network activity after startup.
	// '--no-default-browser-check',
	// // '--disable-default-apps',
	// '--disable-dev-shm-usage',  // crucial for docker support, harmless in non - docker environments
	// // '--disable-extensions',
	// // '--disable-features=' + disabledFeatures(assistantMode).join(','),
	// '--allow-pre-commit-input',  // let page JS run a little early before GPU rendering finishes
	// '--disable-hang-monitor',
	// '--disable-ipc-flooding-protection',  // important to be able to make lots of CDP calls in a tight loop
	// '--disable-popup-blocking',
	// '--disable-prompt-on-repost',
	// '--disable-renderer-backgrounding',
	// // '--force-color-profile=srgb',  // moved to CHROME_DETERMINISTIC_RENDERING_ARGS
	// '--metrics-recording-only',
	// '--no-first-run',
	// '--password-store=basic',
	// '--use-mock-keychain',
	// // // See https://chromium-review.googlesource.com/c/chromium/src/+/2436773
	// '--no-service-autorun',
	// '--export-tagged-pdf',
	// // // https://chromium-review.googlesource.com/c/chromium/src/+/4853540
	// '--disable-search-engine-choice-screen',
	// // // https://issues.chromium.org/41491762
	// '--unsafely-disable-devtools-self-xss-warnings',
	// added by us:
	'--enable-features=NetworkService,NetworkServiceInProcess',
	'--enable-network-information-downlink-max',
	'--test-type=gpu',
	'--disable-sync',
	'--allow-legacy-extension-manifests',
	'--allow-pre-commit-input',
	'--disable-blink-features=AutomationControlled',
	'--install-autogenerated-theme=0,0,0',
	// '--hide-scrollbars',                     // leave them visible! the agent uses them to know when it needs to scroll to see more options
	'--log-level=2',
	// '--enable-logging=stderr',
	'--disable-focus-on-load',
	'--disable-window-activation',
	'--generate-pdf-document-outline',
	'--no-pings',
	'--ash-no-nudges',
	'--disable-infobars',
	'--simulate-outdated-no-au="Tue, 31 Dec 2099 23:59:59 GMT"',
	'--hide-crash-restore-bubble',
	'--suppress-message-center-popups',
	'--disable-domain-reliability',
	'--disable-datasaver-prompt',
	'--disable-speech-synthesis-api',
	'--disable-speech-api',
	'--disable-print-preview',
	'--safebrowsing-disable-auto-update',
	'--disable-external-intent-requests',
	'--disable-desktop-notifications',
	'--noerrdialogs',
	'--silent-debugger-extension-api',
	`--disable-features=${CHROME_DISABLED_COMPONENTS.join(',')}`,
];

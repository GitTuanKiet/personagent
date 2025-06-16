// Python source reference: https://raw.githubusercontent.com/browser-use/browser-use/refs/heads/main/browser_use/dom/services.py
// Last updated: 2025-05-21

import { join } from 'node:path';
import type { Page, ViewportSize } from 'patchright';
import type { SelectorMap } from './views';
import { DOMBaseNode, DOMElementNode, DOMTextNode, DOMState } from './views';
import { timeExecutionAsync } from '../utils';
import { singleton } from '../di';

@singleton()
export class DomService {
	xpathCache: Record<string, any> = {};
	private _jsCode?: string;

	private async _getJsCode(): Promise<string> {
		if (this._jsCode) return this._jsCode;
		const path = join(__dirname, 'buildDomTree.js');
		const { readFile } = await import('node:fs/promises');
		this._jsCode = await readFile(path, 'utf-8');

		return this._jsCode as string;
	}

	@timeExecutionAsync('--get_clickable_elements')
	async getClickableElements(
		page: Page,
		{
			highlightElements = true,
			focusElement = -1,
			viewportExpansion = 0,
		}: {
			highlightElements?: boolean;
			focusElement?: number;
			viewportExpansion?: number;
		},
	): Promise<DOMState> {
		const [elementTree, selectorMap] = await this._buildDomTree(
			page,
			highlightElements,
			focusElement,
			viewportExpansion,
		);
		return new DOMState({ elementTree, selectorMap });
	}

	@timeExecutionAsync('--get_cross_origin_iframes')
	async getCrossOriginIframes(page: Page): Promise<string[]> {
		const hiddenFrameUrls: string[] = await page
			.locator('iframe')
			.filter({ visible: false })
			.evaluateAll((elements: any[]) => elements.map((e: any) => e.src));

		const isAdUrl = (url: string) =>
			['doubleclick.net', 'adroll.com', 'googletagmanager.com'].some((domain) =>
				url.includes(domain),
			);

		return page
			.frames()
			.filter(
				(frame) =>
					frame.url() &&
					new URL(frame.url()).origin !== new URL(page.url()).origin &&
					!hiddenFrameUrls.includes(frame.url()) &&
					!isAdUrl(frame.url()),
			)
			.map((frame) => frame.url());
	}

	@timeExecutionAsync('--build_dom_tree')
	private async _buildDomTree(
		page: Page,
		highlightElements: boolean,
		focusElement: number,
		viewportExpansion: number,
	): Promise<[DOMElementNode, SelectorMap]> {
		if ((await page.evaluate('1+1')) !== 2) {
			throw new Error('The page cannot evaluate javascript code properly');
		}
		if (page.url() === 'about:blank') {
			return [
				new DOMElementNode({
					tagName: 'body',
					xpath: '',
					attributes: {},
					children: [],
					isVisible: false,
				}),
				new Map(),
			];
		}

		// NOTE: We execute JS code in the browser to extract important DOM information.
		//       The returned hash map contains information about the DOM tree and the
		//       relationship between the DOM elements.
		const debugMode = process.env.DEBUG_MODE === 'true';
		const args = {
			doHighlightElements: highlightElements,
			focusHighlightIndex: focusElement,
			viewportExpansion,
			debugMode,
		};

		let evalPage: Record<string, any>;
		try {
			evalPage = await page.evaluate(new Function('return ' + (await this._getJsCode()))(), args);
		} catch (e) {
			console.error('Error evaluating JavaScript: ' + e);
			throw e;
		}

		// Only log performance metrics in debug mode
		if (debugMode && 'perfMetrics' in evalPage) {
			console.debug(
				`DOM Tree Building Performance Metrics for: ${page.url()}\n${JSON.stringify(evalPage['perfMetrics'], null, 2)}`,
			);
		}

		return this._constructDomTree(evalPage);
	}

	@timeExecutionAsync('--construct_dom_tree')
	private async _constructDomTree(
		evalPage: Record<string, any>,
	): Promise<[DOMElementNode, SelectorMap]> {
		const jsNodeMap = evalPage['map'] as Record<string, any>;
		const jsRootId = evalPage['rootId'] as string;

		const selectorMap: SelectorMap = new Map();
		const nodeMap: Record<string, DOMBaseNode> = {};

		for (const [id, nodeData] of Object.entries(jsNodeMap)) {
			const [node, childrenIds] = this._parseNode(nodeData);
			if (!node) continue;
			nodeMap[id] = node;
			if (node instanceof DOMElementNode && node.highlightIndex !== undefined) {
				selectorMap.set(node.highlightIndex!, node as DOMElementNode);
			}

			// NOTE: We know that we are building the tree bottom up
			//       and all children are already processed.
			if (node instanceof DOMElementNode) {
				for (const childId of childrenIds) {
					if (!(childId in nodeMap)) continue;
					const childNode = nodeMap[childId]!;
					childNode.parent = node;
					node.children.push(childNode);
				}
			}
		}

		const htmlToDict = nodeMap[jsRootId];
		if (!htmlToDict || !(htmlToDict instanceof DOMElementNode)) {
			throw new Error('Failed to parse HTML to dictionary');
		}
		return [htmlToDict, selectorMap];
	}

	private _parseNode(nodeData: Record<string, any>): [DOMBaseNode | null, string[]] {
		if (!nodeData) return [null, []];

		// Process text nodes immediately
		if (nodeData.type === 'TEXT_NODE') {
			return [
				new DOMTextNode({
					text: nodeData.text,
					isVisible: nodeData.isVisible,
				}),
				[],
			];
		}

		// Process coordinates if they exist for element nodes
		let viewportInfo: ViewportSize | undefined;
		if (nodeData.viewport) {
			viewportInfo = {
				width: nodeData.viewport.width,
				height: nodeData.viewport.height,
			};
		}
		const elementNode: DOMElementNode = new DOMElementNode({
			tagName: nodeData.tagName,
			xpath: nodeData.xpath,
			attributes: nodeData.attributes || {},
			children: [],
			isVisible: nodeData.isVisible ?? false,
			isInteractive: nodeData.isInteractive ?? false,
			isTopElement: nodeData.isTopElement ?? false,
			isInViewport: nodeData.isInViewport ?? false,
			highlightIndex: nodeData.highlightIndex,
			shadowRoot: nodeData.shadowRoot ?? false,
			viewportInfo,
		});

		const childrenIds = nodeData.children || [];
		return [elementNode, childrenIds];
	}
}

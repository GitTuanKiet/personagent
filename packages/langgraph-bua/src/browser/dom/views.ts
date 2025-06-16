// Python source reference: https://raw.githubusercontent.com/browser-use/browser-use/refs/heads/main/browser_use/dom/views.py
// Last updated: 2025-05-21

import { HistoryTreeProcessor } from './history_tree_processor/service';
import type { ViewportInfo, HashedDomElement, CoordinateSet } from './history_tree_processor/views';
import { memoized } from '../utils';
import { container } from '../di';

export abstract class DOMBaseNode {
	isVisible: boolean;
	parent?: DOMElementNode;

	constructor({ isVisible, parent }: { isVisible: boolean; parent?: DOMElementNode }) {
		this.isVisible = isVisible;
		this.parent = parent;
	}

	abstract toJSON(): object;
}

export class DOMTextNode extends DOMBaseNode {
	text: string;
	type: string = 'TEXT_NODE';

	constructor({
		text,
		isVisible,
		parent,
	}: { text: string; isVisible: boolean; parent?: DOMElementNode }) {
		super({ isVisible, parent });
		this.text = text;
	}

	hasParentWithHighlightIndex(): boolean {
		let current = this.parent;
		while (!!current) {
			if (!!current.highlightIndex) {
				return true;
			}
			current = current.parent;
		}
		return false;
	}

	isParentInViewport(): boolean {
		return this.parent ? this.parent.isInViewport : false;
	}

	isParentTopElement(): boolean {
		return this.parent ? this.parent.isTopElement : false;
	}

	toJSON(): object {
		return {
			text: this.text,
			type: this.type,
		};
	}
}

/**
 * xpath: the xpath of the element from the last root node(shadow root or iframe OR document if no shadow root or iframe).
 * To properly reference the element we need to recursively switch the root node until we find the element(work you way up the tree with `.parent`)
 */
export class DOMElementNode extends DOMBaseNode {
	private historyTreeProcessor: HistoryTreeProcessor;

	tagName: string;
	xpath: string;
	attributes: Record<string, string>;
	children: Array<DOMBaseNode>;
	isInteractive: boolean = false;
	isTopElement: boolean = false;
	isInViewport: boolean = false;
	shadowRoot: boolean = false;
	highlightIndex?: number;
	viewportCoordinates?: CoordinateSet;
	pageCoordinates?: CoordinateSet;
	viewportInfo?: ViewportInfo;

	/**
	 * State injected by the browser context.
	 *
	 * The idea is that the clickable elements are sometimes persistent from the previous page -> tells the model which objects are new/_how_ the state has changed
	 */
	isNew?: boolean;

	constructor(params: {
		tagName: string;
		xpath: string;
		attributes: Record<string, string>;
		children: Array<DOMBaseNode>;
		isVisible: boolean;
		parent?: DOMElementNode;
		isInteractive?: boolean;
		isTopElement?: boolean;
		isInViewport?: boolean;
		shadowRoot?: boolean;
		highlightIndex?: number;
		viewportCoordinates?: CoordinateSet;
		pageCoordinates?: CoordinateSet;
		viewportInfo?: ViewportInfo;
		isNew?: boolean;
	}) {
		super({ isVisible: params.isVisible, parent: params.parent });
		this.tagName = params.tagName;
		this.xpath = params.xpath;
		this.attributes = params.attributes;
		this.children = params.children;
		this.isInteractive = params.isInteractive ?? false;
		this.isTopElement = params.isTopElement ?? false;
		this.isInViewport = params.isInViewport ?? false;
		this.shadowRoot = params.shadowRoot ?? false;
		this.highlightIndex = params.highlightIndex;
		this.viewportCoordinates = params.viewportCoordinates;
		this.pageCoordinates = params.pageCoordinates;
		this.viewportInfo = params.viewportInfo;
		this.isNew = params.isNew;

		this.historyTreeProcessor = container.get(HistoryTreeProcessor);
	}

	toJSON() {
		return {
			tag_name: this.tagName,
			xpath: this.xpath,
			attributes: this.attributes,
			is_visible: this.isVisible,
			is_interactive: this.isInteractive,
			is_top_element: this.isTopElement,
			is_in_viewport: this.isInViewport,
			shadow_root: this.shadowRoot,
			highlight_index: this.highlightIndex,
			viewport_coordinates: this.viewportCoordinates,
			page_coordinates: this.pageCoordinates,
			children: this.children.map((child) => child.toJSON()),
		};
	}

	toString(): string {
		let tagStr = `<${this.tagName}`;
		for (const key in this.attributes) {
			tagStr += ` ${key}="${this.attributes[key]}"`;
		}
		tagStr += '>';
		const extras: string[] = [];
		if (this.isInteractive) extras.push('interactive');
		if (this.isTopElement) extras.push('top');
		if (this.shadowRoot) extras.push('shadow-root');
		if (this.highlightIndex !== null && this.highlightIndex !== undefined)
			extras.push(`highlight:${this.highlightIndex}`);
		if (this.isInViewport) extras.push('in-viewport');
		if (extras.length) tagStr += ` [${extras.join(', ')}]`;
		return tagStr;
	}

	@memoized
	get hash(): HashedDomElement {
		return this.historyTreeProcessor.hashDomElement(this);
	}

	getAllTextTillNextClickableElement(maxDepth: number = -1): string {
		const textParts: string[] = [];
		const collectText = (node: DOMBaseNode, currentDepth: number) => {
			if (maxDepth !== -1 && currentDepth > maxDepth) return;
			if (
				node instanceof DOMElementNode &&
				node !== this &&
				node.highlightIndex !== null &&
				node.highlightIndex !== undefined
			)
				return;
			if (node instanceof DOMTextNode) {
				textParts.push(node.text);
			} else if (node instanceof DOMElementNode) {
				for (const child of node.children) {
					collectText(child, currentDepth + 1);
				}
			}
		};
		collectText(this, 0);
		return textParts.join('\n').trim();
	}

	clickableElementsToString(includeAttributes?: string[]): string {
		const formattedText: string[] = [];
		const processNode = (node: DOMBaseNode, depth: number) => {
			let nextDepth = depth;
			const depthStr = '\t'.repeat(depth);
			if (node instanceof DOMElementNode) {
				if (node.highlightIndex !== null && node.highlightIndex !== undefined) {
					nextDepth += 1;
					const text = node.getAllTextTillNextClickableElement();
					let attributesHtmlStr = '';
					if (includeAttributes) {
						const attributesToInclude: Record<string, string> = {};
						for (const key of includeAttributes) {
							if (key in node.attributes) attributesToInclude[key] = String(node.attributes[key]);
						}
						if (node.tagName === attributesToInclude['role']) delete attributesToInclude['role'];
						if (
							attributesToInclude['aria-label'] &&
							attributesToInclude['aria-label'].trim() === text.trim()
						)
							delete attributesToInclude['aria-label'];
						if (
							attributesToInclude['placeholder'] &&
							attributesToInclude['placeholder'].trim() === text.trim()
						)
							delete attributesToInclude['placeholder'];
						if (Object.keys(attributesToInclude).length) {
							attributesHtmlStr = Object.entries(attributesToInclude)
								.map(([k, v]) => `${k}='${v}'`)
								.join(' ');
						}
					}
					const highlightIndicator = node.isNew
						? `*[${node.highlightIndex}]*`
						: `[${node.highlightIndex}]`;
					let line = `${depthStr}${highlightIndicator}<${node.tagName}`;
					if (attributesHtmlStr) line += ` ${attributesHtmlStr}`;
					if (text) {
						if (!attributesHtmlStr) line += ' ';
						line += `>${text}`;
					} else if (!attributesHtmlStr) {
						line += ' ';
					}
					line += ' />';
					formattedText.push(line);
				}
				for (const child of node.children) {
					processNode(child, nextDepth);
				}
			} else if (node instanceof DOMTextNode) {
				if (
					!node.hasParentWithHighlightIndex() &&
					node.parent &&
					node.parent.isVisible &&
					node.parent.isTopElement
				) {
					formattedText.push(`${depthStr}${node.text}`);
				}
			}
		};
		processNode(this, 0);
		return formattedText.join('\n');
	}

	getFileUploadElement(checkSiblings: boolean = true): DOMElementNode | null {
		if (this.tagName === 'input' && this.attributes['type'] === 'file') return this;
		for (const child of this.children) {
			if (child instanceof DOMElementNode) {
				const result = child.getFileUploadElement(false);
				if (result) return result;
			}
		}
		if (checkSiblings && this.parent) {
			for (const sibling of this.parent.children) {
				if (sibling !== this && sibling instanceof DOMElementNode) {
					const result = sibling.getFileUploadElement(false);
					if (result) return result;
				}
			}
		}
		return null;
	}
}

export type SelectorMap = Map<number, DOMElementNode>;

export class DOMState {
	elementTree: DOMElementNode;
	selectorMap: SelectorMap;

	constructor({
		elementTree,
		selectorMap,
	}: { elementTree: DOMElementNode; selectorMap: SelectorMap }) {
		this.elementTree = elementTree;
		this.selectorMap = selectorMap;
	}
}

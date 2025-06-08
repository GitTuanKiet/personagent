// Python source reference: https://raw.githubusercontent.com/browser-use/browser-use/refs/heads/main/browser_use/dom/history_tree_processor/service.py
// Last updated: 2025-05-21

import { isDeepStrictEqual } from 'node:util';
import { createHash } from 'crypto';
import type { DOMHistoryElement, HashedDomElement } from './views';
import { DOMElementNode } from '../views';
import { singleton } from 'browser/di';
import { enhancedCssSelectorForElement } from 'browser/utils';

@singleton()
export class HistoryTreeProcessor {
	/**
	 * Convert a DOMElementNode to a DOMHistoryElement
	 */
	convertDomElementToHistoryElement(domElement: DOMElementNode): DOMHistoryElement {
		const parentBranchPath = this._getParentBranchPath(domElement);
		const cssSelector = enhancedCssSelectorForElement(domElement);
		return {
			tagName: domElement.tagName,
			xpath: domElement.xpath,
			highlightIndex: domElement.highlightIndex,
			entireParentBranchPath: parentBranchPath,
			attributes: domElement.attributes,
			shadowRoot: domElement.shadowRoot,
			cssSelector,
			pageCoordinates: domElement.pageCoordinates,
			viewportCoordinates: domElement.viewportCoordinates,
			viewportInfo: domElement.viewportInfo,
		};
	}

	/**
	 * Find a DOMElementNode in the tree that matches the DOMHistoryElement
	 */
	findHistoryElementInTree(
		domHistoryElement: DOMHistoryElement,
		tree: DOMElementNode,
	): DOMElementNode | null {
		const hashedDomHistoryElement = this.hashDomHistoryElement(domHistoryElement);

		const processNode = (node: DOMElementNode): DOMElementNode | null => {
			if (!!node.highlightIndex) {
				const hashedNode = this.hashDomElement(node);
				if (isDeepStrictEqual(hashedNode, hashedDomHistoryElement)) {
					return node;
				}
			}
			for (const child of node.children) {
				if (child instanceof DOMElementNode) {
					const result = processNode(child);
					if (result) return result;
				}
			}
			return null;
		};
		return processNode(tree);
	}

	/**
	 * Compare a DOMHistoryElement and a DOMElementNode for equality
	 */
	compareHistoryElementAndDomElement(
		domHistoryElement: DOMHistoryElement,
		domElement: DOMElementNode,
	): boolean {
		const hashedDomHistoryElement = this.hashDomHistoryElement(domHistoryElement);
		const hashedDomElement = this.hashDomElement(domElement);
		return isDeepStrictEqual(hashedDomHistoryElement, hashedDomElement);
	}

	hashDomHistoryElement(domHistoryElement: DOMHistoryElement): HashedDomElement {
		const branchPathHash = this._parentBranchPathHash(domHistoryElement.entireParentBranchPath);
		const attributesHash = this._attributesHash(domHistoryElement.attributes);
		const xpathHash = this._xpathHash(domHistoryElement.xpath);
		return {
			branchPathHash,
			attributesHash,
			xpathHash,
		};
	}

	hashDomElement(domElement: DOMElementNode): HashedDomElement {
		const parentBranchPath = this._getParentBranchPath(domElement);
		const branchPathHash = this._parentBranchPathHash(parentBranchPath);
		const attributesHash = this._attributesHash(domElement.attributes);
		const xpathHash = this._xpathHash(domElement.xpath);
		// const textHash = this._textHash(domElement);
		return {
			branchPathHash,
			attributesHash,
			xpathHash,
		};
	}

	private _getParentBranchPath(domElement: DOMElementNode): string[] {
		const parents: DOMElementNode[] = [];
		let currentElement: DOMElementNode | null = domElement;
		while (currentElement.parent) {
			parents.push(currentElement);
			currentElement = currentElement.parent;
		}
		parents.reverse();
		return parents.map((parent) => parent.tagName);
	}

	private _parentBranchPathHash(parentBranchPath: string[]): string {
		const parentBranchPathString = parentBranchPath.join('/');
		return createHash('sha256').update(parentBranchPathString).digest('hex');
	}

	private _attributesHash(attributes: Record<string, string>): string {
		const attributesString = Object.entries(attributes)
			.map(([key, value]) => `${key}=${value}`)
			.join('');
		return createHash('sha256').update(attributesString).digest('hex');
	}

	private _xpathHash(xpath: string): string {
		return createHash('sha256').update(xpath).digest('hex');
	}
}

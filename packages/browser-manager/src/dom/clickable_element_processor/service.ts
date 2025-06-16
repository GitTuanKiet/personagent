// #region Python source reference: https://raw.githubusercontent.com/browser-use/browser-use/refs/heads/main/browser_use/dom/clickable_element_processor/service.py
// Last updated: 2025-05-21

import { createHash } from 'node:crypto';
import { DOMElementNode } from '../views';
import { singleton } from '../../di';

@singleton()
export class ClickableElementProcessor {
	/**
	 * Get all clickable elements in the DOM tree and return their hashes
	 */
	getClickableElementsHashes(domElement: DOMElementNode): Set<string> {
		const clickableElements = this.getClickableElements(domElement);
		return new Set(clickableElements.map((element) => this.hashDomElement(element)));
	}

	/**
	 * Get all clickable elements in the DOM tree
	 */
	getClickableElements(domElement: DOMElementNode): DOMElementNode[] {
		const clickableElements: DOMElementNode[] = [];
		for (const child of domElement.children) {
			if (child instanceof DOMElementNode) {
				if (child.highlightIndex) {
					clickableElements.push(child);
				}
				clickableElements.push(...this.getClickableElements(child));
			}
		}
		return clickableElements;
	}

	/**
	 * Hash a DOMElementNode
	 */
	hashDomElement(domElement: DOMElementNode): string {
		const parentBranchPath = this._getParentBranchPath(domElement);
		const branchPathHash = this._parentBranchPathHash(parentBranchPath);
		const attributesHash = this._attributesHash(domElement.attributes);
		const xpathHash = this._xpathHash(domElement.xpath);
		// const textHash = this._textHash(domElement);

		return this._hashString(`${branchPathHash}-${attributesHash}-${xpathHash}`);
	}

	_getParentBranchPath(domElement: DOMElementNode): string[] {
		const parents: DOMElementNode[] = [];
		let currentElement: DOMElementNode = domElement;
		while (currentElement.parent) {
			parents.push(currentElement);
			currentElement = currentElement.parent;
		}
		parents.reverse();
		return parents.map((parent) => parent.tagName);
	}

	private _parentBranchPathHash(parentBranchPath: string[]): string {
		const parentBranchPathString = parentBranchPath.join('/');
		return this._hashString(parentBranchPathString);
	}

	private _attributesHash(attributes: Record<string, string>): string {
		const attributesString = Object.entries(attributes)
			.map(([key, value]) => `${key}=${value}`)
			.join('');
		return this._hashString(attributesString);
	}

	private _xpathHash(xpath: string): string {
		return this._hashString(xpath);
	}

	private _hashString(str: string): string {
		return createHash('sha256').update(str).digest('hex');
	}
}

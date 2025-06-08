// Python source reference: https://raw.githubusercontent.com/browser-use/browser-use/refs/heads/main/browser_use/dom/history_tree_processor/view.py
// Last updated: 2025-05-21

/**
 * Hash of the dom element to be used as a unique identifier
 */
export interface HashedDomElement {
	branchPathHash: string;
	attributesHash: string;
	xpathHash: string;
	// textHash?: string;
}

export interface Coordinates {
	x: number;
	y: number;
}

export interface CoordinateSet {
	topLeft: Coordinates;
	topRight: Coordinates;
	bottomLeft: Coordinates;
	bottomRight: Coordinates;
	center: Coordinates;
	width: number;
	height: number;
}

export interface ViewportInfo {
	scrollX?: number;
	scrollY?: number;
	width: number;
	height: number;
}

export interface DOMHistoryElement {
	tagName: string;
	xpath: string;
	highlightIndex?: number;
	entireParentBranchPath: string[];
	attributes: Record<string, string>;
	shadowRoot?: boolean;
	cssSelector?: string;
	pageCoordinates?: CoordinateSet;
	viewportCoordinates?: CoordinateSet;
	viewportInfo?: ViewportInfo;
}

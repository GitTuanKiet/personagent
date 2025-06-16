import assert from 'node:assert';
import { promises as fsp } from 'node:fs';
import { join } from 'node:path';
import type { DOMElementNode } from '../dom/views';

/**
 * Times the execution of a synchronous method.
 * @param additionalText - The additional text to add to the execution time.
 * @returns The decorated method.
 */
export function timeExecutionSync<T extends (...args: any[]) => any>(
	additionalText = '',
): MethodDecorator {
	return function (_target: Object, _propertyKey: string | symbol, descriptor: PropertyDescriptor) {
		const originalMethod = descriptor.value!;
		descriptor.value = function (this: Object, ...args: Parameters<T>): ReturnType<T> {
			const startTime = performance.now();
			const result = originalMethod.apply(this, args);
			const endTime = performance.now();
			const executionTime = (endTime - startTime) / 1000;
			console.debug(`${additionalText} Execution time: ${executionTime.toFixed(2)} seconds`);
			return result;
		} as T;

		return descriptor;
	};
}

/**
 * Times the execution of an asynchronous method.
 * @param additionalText - The additional text to add to the execution time.
 * @returns The decorated method.
 */
export function timeExecutionAsync<T extends (...args: any[]) => Promise<any>>(
	additionalText = '',
): MethodDecorator {
	return function (_target: Object, _propertyKey: string | symbol, descriptor: PropertyDescriptor) {
		const originalMethod = descriptor.value!;
		descriptor.value = async function (
			this: Object,
			...args: Parameters<T>
		): Promise<ReturnType<T>> {
			const startTime = performance.now();
			const result = await originalMethod.apply(this, args);
			const endTime = performance.now();
			const executionTime = (endTime - startTime) / 1000;
			console.debug(`${additionalText} Execution time: ${executionTime.toFixed(2)} seconds`);
			return result;
		} as T;

		return descriptor;
	};
}

/**
 * Sleeps for a given number of milliseconds
 * @param ms - The number of milliseconds to sleep
 */
export async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

/**
 * A decorator that implements memoization for class property getters.
 *
 * The decorated getter will only be executed once and its value cached for subsequent access
 *
 * @example
 * class Example {
 *   @memoized
 *   get computedValue() {
 *     // This will only run once and the result will be cached
 *     return heavyComputation();
 *   }
 * }
 *
 * @throws If decorator is used on something other than a getter
 */
export function memoized<T = unknown>(
	target: object,
	propertyKey: string | symbol,
	descriptor?: TypedPropertyDescriptor<T>,
): TypedPropertyDescriptor<T> {
	const originalGetter = descriptor?.get;
	assert(originalGetter, '@memoized can only be used on getters');

	// Replace the original getter for the first call
	descriptor.get = function (this: typeof target.constructor): T {
		const value = originalGetter.call(this);
		// Add a property on the class instance to stop reading from the getter on class prototype
		Object.defineProperty(this, propertyKey, {
			value,
			configurable: false,
			enumerable: false,
			writable: false,
		});
		return value;
	};

	return descriptor;
}

/**
 * Truncate a URL to a maximum length.
 * @param s - The URL to truncate.
 * @param maxLen - The maximum length of the URL.
 * @returns The truncated URL.
 */
export function truncateUrl(s: string, maxLen?: number): string {
	s = s.replace('https://', '').replace('http://', '').replace('www.', '');
	if (maxLen !== undefined && s.length > maxLen) {
		return s.slice(0, maxLen) + '…';
	}
	return s;
}

/**
 * Converts a simple XPath to a CSS selector.
 * @param xpath - The XPath to convert.
 * @returns The CSS selector.
 */
export function convertSimpleXpathToCssSelector(xpath: string): string {
	if (!xpath) return '';

	xpath = xpath.replace(/^\/+/, '');

	const parts = xpath.split('/');
	const cssParts: string[] = [];

	for (const part of parts) {
		if (!part) continue;

		if (part.includes(':') && !part.includes('[')) {
			const basePart = part.replace(/:/g, '\\:');
			cssParts.push(basePart);
			continue;
		}

		if (part.includes('[')) {
			let basePart = part.slice(0, part.indexOf('['));

			if (basePart.includes(':')) {
				basePart = basePart.replace(/:/g, '\\:');
			}

			const indexPart = part.slice(part.indexOf('['));
			const indices = indexPart
				.split(']')
				.slice(0, -1)
				.map((i) => i.replace('[', ''));

			for (const idx of indices) {
				try {
					if (/^\\d+$/.test(idx)) {
						const index = parseInt(idx, 10);
						basePart += `:nth-of-type(${index})`;
					} else if (idx === 'last()') {
						basePart += ':last-of-type';
					} else if (idx.includes('position()')) {
						if (idx.includes('>1')) {
							basePart += ':nth-of-type(n+2)';
						}
					}
				} catch {
					continue;
				}
			}

			cssParts.push(basePart);
		} else {
			cssParts.push(part);
		}
	}

	return cssParts.join(' > ');
}

/**
 * Gets a unique filename in a directory.
 * @param directory - The directory to get the unique filename in.
 * @param filename - The filename to get the unique filename for.
 * @returns The unique filename.
 */
export async function getUniqueFilename(directory: string, filename: string): Promise<string> {
	const [base, ext] = filename.split('.');
	let counter = 1;
	let newFilename = filename;
	while (await fsp.exists(join(directory, newFilename))) {
		newFilename = `${base} (${counter})${ext}`;
		counter += 1;
	}
	return newFilename;
}

/**
 * Converts a DOMElementNode to a CSS selector.
 * @param element - The DOMElementNode to convert.
 * @param includeDynamicAttributes - Whether to include dynamic attributes.
 * @returns The CSS selector.
 */
export function enhancedCssSelectorForElement(
	element: DOMElementNode,
	includeDynamicAttributes: boolean = true,
): string {
	try {
		let cssSelector = convertSimpleXpathToCssSelector(element.xpath);

		if ('class' in element.attributes && element.attributes['class'] && includeDynamicAttributes) {
			// Define a regex pattern for valid class names in CSS
			const validClassNamePattern = new RegExp('^[a-zA-Z_][a-zA-Z0-9_-]*$');

			// Iterate through the class attribute values
			const classes = element.attributes['class'].split(',');
			for (const className of classes) {
				// Skip empty class names
				if (!className.trim()) {
					continue;
				}

				// Check if the class name is valid
				if (validClassNamePattern.test(className)) {
					// Append the valid class name to the CSS selector
					cssSelector += `.${className}`;
				} else {
					// Skip invalid class names
					continue;
				}
			}

			const SAFE_ATTRIBUTES = [
				// Data attributes (if they're stable in your application)
				'id',
				// Standard HTML attributes
				'name',
				'type',
				'placeholder',
				// Accessibility attributes
				'aria-label',
				'aria-labelledby',
				'aria-describedby',
				'role',
				// Common form attributes
				'for',
				'autocomplete',
				'required',
				'readonly',
				// Media attributes
				'alt',
				'title',
				'src',
				// Custom stable attributes (add any application-specific ones)
				'href',
				'target',
			];

			if (includeDynamicAttributes) {
				const dynamic_attributes = ['data-id', 'data-qa', 'data-cy', 'data-testid'];
				SAFE_ATTRIBUTES.push(...dynamic_attributes);
			}

			for (let [attribute, value] of Object.entries(element.attributes)) {
				if (attribute == 'class') {
					continue;
				}

				if (!attribute.trim()) {
					continue;
				}

				if (!SAFE_ATTRIBUTES.includes(attribute)) {
					continue;
				}

				const safe_attribute = attribute.replace(':', '\\:');

				if (value == '') {
					cssSelector += `[${safe_attribute}]`;
				} else if (
					value.split('').some((char) => ['"', '<', '>', '`', '\n', '\r', '\t'].includes(char))
				) {
					if (value.includes('\n')) {
						value = value.split('\n')[0]!;
						const collapsed_value = value.replace(/\s+/g, ' ').trim();
						const safe_value = collapsed_value.replace('"', '\\"');
						cssSelector += `[${safe_attribute}*="${safe_value}"]`;
					} else {
						cssSelector += `[${safe_attribute}="${value}"]`;
					}
				} else {
					cssSelector += `[${safe_attribute}="${value}"]`;
				}
			}
		}
		return cssSelector;
	} catch (e) {
		const tagName = element.tagName || '*';
		return `${tagName}[highlight_index='${element.highlightIndex}']`;
	}
}

export function cleanAttribute(attribute: string | null) {
	return attribute ? attribute.replace(/(\n+\s*)+/g, '\n') : '';
}

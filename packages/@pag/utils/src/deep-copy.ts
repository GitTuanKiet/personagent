import type { Primitives } from './types';

// NOTE: BigInt.prototype.toJSON is not available, which causes JSON.stringify to throw an error
// as well as the flatted stringify method. This is a workaround for that.
BigInt.prototype.toJSON = function () {
	return this.toString();
};

/**
 * Deep copy of an object
 * @param source - The source object to copy
 * @param hash - A WeakMap to track already cloned objects
 * @param path - The path of the object
 * @returns A deep copy of the source object
 */
export function deepCopy<T extends ((object | Date) & { toJSON?: () => string }) | Primitives>(
	source: T,
	hash = new WeakMap(),
	path = '',
): T {
	const hasOwnProp = Object.prototype.hasOwnProperty.bind(source);
	if (typeof source !== 'object' || source === null || typeof source === 'function') {
		return source;
	}
	if (typeof source.toJSON === 'function') {
		return source.toJSON() as T;
	}
	if (hash.has(source)) {
		return hash.get(source);
	}
	if (Array.isArray(source)) {
		const clone = [];
		const len = source.length;
		for (let i = 0; i < len; i++) {
			clone[i] = deepCopy(source[i], hash, path + `[${i}]`);
		}
		return clone as T;
	}
	const clone = Object.create(Object.getPrototypeOf({}));
	hash.set(source, clone);
	for (const i in source) {
		if (hasOwnProp(i)) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			clone[i] = deepCopy((source as any)[i], hash, path + `.${i}`);
		}
	}
	return clone;
}

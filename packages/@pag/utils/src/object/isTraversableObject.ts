import type { JsonObject } from '../types';

/**
 * Checks if a value is a traversable object
 * @param value - The value to check
 * @returns True if the value is a traversable object, false otherwise
 */
export function isTraversableObject(value: any): value is JsonObject {
	return value && typeof value === 'object' && !Array.isArray(value) && !!Object.keys(value).length;
}

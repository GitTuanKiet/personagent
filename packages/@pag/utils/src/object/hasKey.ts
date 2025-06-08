/**
 * Checks if an object has a key
 * @param value - The value to check
 * @param key - The key to check
 * @returns True if the object has the key, false otherwise
 */
export function hasKey<T extends PropertyKey>(value: unknown, key: T): value is Record<T, unknown> {
	return (
		value !== null && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, key)
	);
}

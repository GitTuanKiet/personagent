/**
 * Asserts given condition
 * @param condition - The condition to assert
 * @param msg - The message to display if the condition is not met
 */
export function assert<T>(condition: T, msg?: string): asserts condition {
	if (!condition) {
		const error = new Error(msg ?? 'Invalid assertion');
		if ((Error as any).hasOwnProperty('captureStackTrace')) {
			(Error as any).captureStackTrace(error, assert);
		} else if (error.stack) {
			error.stack = error.stack.split('\n').slice(1).join('\n');
		}
		throw error;
	}
}

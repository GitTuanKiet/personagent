export function randomInt(max: number): number;
export function randomInt(min: number, max: number): number;
/**
 * Generates a random integer between a minimum and maximum value
 * @param min - The minimum value
 * @param max - The maximum value
 * @returns A random integer between the minimum and maximum value
 */
export function randomInt(min: number, max?: number): number {
	if (max === undefined) {
		max = min;
		min = 0;
	}
	return min + (crypto.getRandomValues(new Uint32Array(1))[0] % (max - min));
}

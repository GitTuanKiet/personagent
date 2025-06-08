import { ALPHABET } from '../constants';
import { randomInt } from '../number/randomInt';

export function randomString(length: number): string;
export function randomString(minLength: number, maxLength: number): string;
/**
 * Generates a random string of a given length
 * @param minLength - The minimum length of the string to generate
 * @param maxLength - The maximum length of the string to generate
 * @returns A random string of the given length
 */
export function randomString(minLength: number, maxLength?: number): string {
	const length = maxLength === undefined ? minLength : randomInt(minLength, maxLength + 1);
	return [...crypto.getRandomValues(new Uint32Array(length))]
		.map((byte) => ALPHABET[byte % ALPHABET.length])
		.join('');
}

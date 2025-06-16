import { wyhash as wyhash64 } from './wyhash';
import { wyhash32 } from './wyhash32';

export function wyhash(
	data: string | ArrayBufferView | ArrayBuffer | SharedArrayBuffer,
	seed?: number | bigint,
) {
	let hasher =
		seed && typeof seed === 'number'
			? (data: Uint8Array) => wyhash32(data, seed)
			: (data: Uint8Array) => wyhash64(data, seed ? BigInt(seed) : 0n);

	const buffer =
		typeof data === 'string'
			? new TextEncoder().encode(data)
			: 'buffer' in data
				? new Uint8Array(data.buffer)
				: new Uint8Array(data);

	return hasher(buffer);
}

// wyhash32.ts - 32-bit version of wyhash in TypeScript
// @ts-nocheck

function wyr4(p: Uint8Array, i: number = 0): number {
	let r = 0;
	for (let j = 0; j < 4; j++) {
		r |= p[i + j] << (j * 8);
	}
	return r >>> 0;
}

function wyr24(p: Uint8Array, k: number): number {
	return (p[0] << 16) | (p[k >> 1] << 8) | p[k - 1];
}

function wymix32(A: number, B: number): [number, number] {
	const c = BigInt(A ^ 0x53c5ca59) * BigInt(B ^ 0x74743c1b);
	return [Number(c & 0xffffffffn), Number((c >> 32n) & 0xffffffffn)];
}

export function wyhash32(key: Uint8Array, seed: number): number {
	let len = key.length;
	let p = 0;
	let see1 = len >>> 0;
	seed ^= (len >>> 32) >>> 0;
	[seed, see1] = wymix32(seed, see1);

	while (len > 8) {
		seed ^= wyr4(key, p);
		see1 ^= wyr4(key, p + 4);
		[seed, see1] = wymix32(seed, see1);
		p += 8;
		len -= 8;
	}

	if (len >= 4) {
		seed ^= wyr4(key, p);
		see1 ^= wyr4(key, p + len - 4);
	} else if (len) {
		seed ^= wyr24(key, len);
	}

	[seed, see1] = wymix32(seed, see1);
	[seed, see1] = wymix32(seed, see1);
	return seed ^ see1;
}

export function wy32x32(a: number, b: number): number {
	[a, b] = wymix32(a, b);
	[a, b] = wymix32(a, b);
	return a ^ b;
}

export function wy2u01_32(r: number): number {
	const wynorm = 1 / (1 << 23);
	return (r >>> 9) * wynorm;
}

export function wy2gau_32(r: number): number {
	const wynorm = 1 / (1 << 9);
	return ((r & 0x3ff) + ((r >>> 10) & 0x3ff) + ((r >>> 20) & 0x3ff)) * wynorm - 3.0;
}

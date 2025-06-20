// wyhash64.ts - 64-bit version of wyhash in TypeScript
// @ts-nocheck

export type Uint64 = bigint;

export const _wyp: [Uint64, Uint64, Uint64, Uint64] = [
	0x2d358dccaa6c78a5n,
	0x8bb84b93962eacc9n,
	0x4b33a62ed433d4a3n,
	0x4d5a2da51de1aa47n,
];

// const _wyp: [Uint64, Uint64, Uint64, Uint64] = [
//     0xa0761d6478bd642fn,
//     0xe7037ed1a0b428dbn,
//     0x8ebc6af09c88c6e3n,
//     0x589965cc75374cc3n,
// ];

// function rot64(x: Uint64): Uint64 {
//     return ((x >> 32n) | (x << 32n)) & 0xffffffffffffffffn;
// }

function wymum(A: Uint64, B: Uint64): [Uint64, Uint64] {
	const r = A * B;
	const lo = r & 0xffffffffffffffffn;
	const hi = (r >> 64n) & 0xffffffffffffffffn;
	return [lo, hi];
}

function wymix(A: Uint64, B: Uint64): Uint64 {
	const [lo, hi] = wymum(A, B);
	return lo ^ hi;
}

function wyr8(p: Uint8Array, i: number = 0): Uint64 {
	let r = 0n;
	for (let j = 0; j < 8; j++) {
		r |= BigInt(p[i + j]) << BigInt(j * 8);
	}
	return r;
}

function wyr4(p: Uint8Array, i: number = 0): number {
	let r = 0;
	for (let j = 0; j < 4; j++) {
		r |= p[i + j] << (j * 8);
	}
	return r >>> 0;
}

function wyr3(p: Uint8Array, k: number): Uint64 {
	return (BigInt(p[0]) << 16n) | (BigInt(p[k >> 1]) << 8n) | BigInt(p[k - 1]);
}

export function wyhash(
	key: Uint8Array,
	seed: Uint64,
	secret: [Uint64, Uint64, Uint64, Uint64] = _wyp,
): Uint64 {
	let p = 0;
	const len = key.length;
	seed ^= wymix(seed ^ secret[0], secret[1]);
	let a: Uint64 = 0n,
		b: Uint64 = 0n;

	if (len <= 16) {
		if (len >= 4) {
			a = (BigInt(wyr4(key, 0)) << 32n) | BigInt(wyr4(key, (len >> 3) << 2));
			b = (BigInt(wyr4(key, len - 4)) << 32n) | BigInt(wyr4(key, len - 4 - ((len >> 3) << 2)));
		} else if (len > 0) {
			a = wyr3(key, len);
			b = 0n;
		}
	} else {
		let i = len;
		if (i >= 48) {
			let see1 = seed;
			let see2 = seed;
			do {
				seed = wymix(wyr8(key, p) ^ secret[1], wyr8(key, p + 8) ^ seed);
				see1 = wymix(wyr8(key, p + 16) ^ secret[2], wyr8(key, p + 24) ^ see1);
				see2 = wymix(wyr8(key, p + 32) ^ secret[3], wyr8(key, p + 40) ^ see2);
				p += 48;
				i -= 48;
			} while (i >= 48);
			seed ^= see1 ^ see2;
		}
		while (i > 16) {
			seed = wymix(wyr8(key, p) ^ secret[1], wyr8(key, p + 8) ^ seed);
			p += 16;
			i -= 16;
		}
		a = wyr8(key, p + i - 16);
		b = wyr8(key, p + i - 8);
	}

	a ^= secret[1];
	b ^= seed;
	const [a2, b2] = wymum(a, b);
	return wymix(a2 ^ secret[0] ^ BigInt(len), b2 ^ secret[1]);
}

export function wyhash64(A: Uint64, B: Uint64): Uint64 {
	A ^= _wyp[0];
	B ^= _wyp[1];
	const [a2, b2] = wymum(A, B);
	return wymix(a2 ^ _wyp[0], b2 ^ _wyp[1]);
}

export function wyrand(seed: { value: Uint64 }): Uint64 {
	seed.value = (seed.value + _wyp[0]) & 0xffffffffffffffffn;
	return wymix(seed.value, seed.value ^ _wyp[1]);
}

export function wy2u01(r: Uint64): number {
	const wynorm = 1 / (1 << 52);
	return Number(r >> 12n) * wynorm;
}

export function wy2gau(r: Uint64): number {
	const wynorm = 1 / (1 << 20);
	return (
		(Number(r & 0x1fffffn) + Number((r >> 21n) & 0x1fffffn) + Number((r >> 42n) & 0x1fffffn)) *
			wynorm -
		3.0
	);
}

function mul_mod(a: Uint64, b: Uint64, m: Uint64): Uint64 {
	let r = 0n;
	while (b > 0n) {
		if (b & 1n) r = (r + a) % m;
		b >>= 1n;
		if (b) a = (a + a) % m;
	}
	return r;
}

function pow_mod(a: Uint64, b: Uint64, m: Uint64): Uint64 {
	let r = 1n;
	while (b > 0n) {
		if (b & 1n) r = mul_mod(r, a, m);
		b >>= 1n;
		if (b) a = mul_mod(a, a, m);
	}
	return r;
}

function sprp(n: Uint64, a: Uint64): boolean {
	let d = n - 1n;
	let s = 0;
	while ((d & 1n) === 0n) {
		d >>= 1n;
		s++;
	}
	let b = pow_mod(a, d, n);
	if (b === 1n || b === n - 1n) return true;
	for (let r = 1; r < s; r++) {
		b = mul_mod(b, b, n);
		if (b <= 1n) return false;
		if (b === n - 1n) return true;
	}
	return false;
}

export function is_prime(n: Uint64): boolean {
	if (n < 2n || n % 2n === 0n) return false;
	if (n < 4n) return true;
	const witnesses = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];
	for (const a of witnesses) {
		if (a >= n) break;
		if (!sprp(n, a)) return false;
	}
	return true;
}

export function make_secret(seed: Uint64): [Uint64, Uint64, Uint64, Uint64] {
	const c = [
		15, 23, 27, 29, 30, 39, 43, 45, 46, 51, 53, 54, 57, 58, 60, 71, 75, 77, 78, 83, 85, 86, 89, 90,
		92, 99, 101, 102, 105, 106, 108, 113, 114, 116, 120, 135, 139, 141, 142, 147, 149, 150, 153,
		154, 156, 163, 165, 166, 169, 170, 172, 177, 178, 180, 184, 195, 197, 198, 201, 202, 204, 209,
		210, 212, 216, 225, 226, 228, 232, 240,
	];
	const secret: [Uint64, Uint64, Uint64, Uint64] = [0n, 0n, 0n, 0n];
	const state = { value: seed };
	for (let i = 0; i < 4; i++) {
		let ok = false;
		while (!ok) {
			secret[i] = 0n;
			for (let j = 0; j < 64; j += 8) {
				const byte = c[Number(wyrand(state) % BigInt(c.length))];
				secret[i] |= BigInt(byte) << BigInt(j);
			}
			if (secret[i] % 2n === 0n) continue;
			ok = true;
			for (let j = 0; j < i; j++) {
				const x = secret[j] ^ secret[i];
				const popcount = x.toString(2).split('1').length - 1;
				if (popcount !== 32) {
					ok = false;
					break;
				}
			}
			if (ok && !is_prime(secret[i])) ok = false;
		}
	}
	return secret;
}

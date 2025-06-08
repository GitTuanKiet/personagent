type ResolveFn<T> = (result: T | PromiseLike<T>) => void;
type RejectFn = (error: Error) => void;
interface Defer<T> {
	promise: Promise<T>;
	resolve: ResolveFn<T>;
	reject: RejectFn;
}

/**
 * Creates a new defer object
 * @returns A new defer object
 */
export function Defer<T>(): Defer<T> {
	const self: Defer<T> = {} as Defer<T>;
	self.promise = new Promise((resolve, reject) => {
		self.resolve = resolve;
		self.reject = reject;
	});
	Object.freeze(self);
	return self;
}

export class TimeoutError extends Error {
	code = 'ETIMEDOUT';
}

/**
 * Creates a new timed defer object
 * @param timeout - The timeout in milliseconds
 * @returns A new timed defer object
 */
export function TimedDefer(timeout = 5000): Defer<any> {
	const self: Defer<any> = {} as Defer<any>;
	self.promise = new Promise((resolve, reject) => {
		let timeoutHandle: NodeJS.Timeout | null = setTimeout(() => {
			self.reject(new TimeoutError(`Timed out after ${timeout}ms.`));
		}, timeout);
		self.resolve = (stuff) => {
			if (timeoutHandle) {
				clearTimeout(timeoutHandle);
				timeoutHandle = null;
			}
			return resolve(stuff);
		};
		self.reject = (...argv) => {
			if (timeoutHandle) {
				clearTimeout(timeoutHandle);
				timeoutHandle = null;
			}
			return reject(...argv);
		};
	});
	Object.freeze(self);
	return self;
}

/**
 * Creates a new GC proof defer object
 * @returns A new GC proof defer object
 */
export function GCProofDefer<T = any>(): Promise<T> {
	let resolve: ResolveFn<T>;
	let reject: RejectFn;
	const thePromise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	(thePromise as any).__resolve = resolve!;
	(thePromise as any).__reject = reject!;
	return thePromise;
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

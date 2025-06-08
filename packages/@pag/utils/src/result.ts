import { ensureError } from './ensure-error';

export type ResultOk<T> = { ok: true; result: T };
export type ResultError<E> = { ok: false; error: E };
export type Result<T, E> = ResultOk<T> | ResultError<E>;

export const createResultOk = <T>(data: T): ResultOk<T> => ({
	ok: true,
	result: data,
});

export const createResultError = <E = unknown>(error: E): ResultError<E> => ({
	ok: false,
	error,
});

/**
 * Executes the given function and converts it to a Result object.
 *
 * @example
 * const result = toResultSync(() => fs.writeFileSync('file.txt', 'Hello, World!'));
 */
export const toResultSync = <T, E extends Error = Error>(fn: () => T): Result<T, E> => {
	try {
		return createResultOk<T>(fn());
	} catch (e) {
		const error = ensureError(e);
		return createResultError<E>(error as E);
	}
};

/**
 * Executes the given function and converts it to a Result object.
 *
 * @example
 * const result = toResult(async () => fs.writeFile('file.txt', 'Hello, World!'));
 */
export const toResult = async <T, E extends Error = Error>(
	fn: () => T | Promise<T>,
): Promise<Result<T, E>> => {
	try {
		return createResultOk<T>(await fn());
	} catch (e) {
		const error = ensureError(e);
		return createResultError<E>(error as E);
	}
};

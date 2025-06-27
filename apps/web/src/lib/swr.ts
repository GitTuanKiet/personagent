import useSWR, { SWRHook, SWRConfiguration, Key, Fetcher } from 'swr';

// Optimized SWR hook for client-side data with minimal revalidation intervals
export const useClientDataSWR = <Data = any, Error = any>(
	key: Key,
	fetcher: Fetcher<Data> | null,
	config?: SWRConfiguration<Data, Error>,
) =>
	useSWR(key, fetcher, {
		// default is 2000ms, it makes the user's quick switch don't work correctly.
		// Cause issue like this: https://github.com/lobehub/lobe-chat/issues/532
		// we need to set it to 0.
		dedupingInterval: 0,
		focusThrottleInterval: 5 * 60 * 1000,
		refreshWhenOffline: false,
		revalidateOnFocus: true,
		revalidateOnReconnect: true,
		...config,
	});

// SWR hook that fetches data only once and doesn't revalidate
export const useOnlyFetchOnceSWR = <Data = any, Error = any>(
	key: Key,
	fetcher: Fetcher<Data> | null,
	config?: SWRConfiguration<Data, Error>,
) =>
	useSWR(key, fetcher, {
		refreshWhenOffline: false,
		revalidateOnFocus: false,
		revalidateOnReconnect: false,
		...config,
	});

// SWR hook for actions that should not auto-revalidate
export const useActionSWR = <Data = any, Error = any>(
	key: Key,
	fetcher: Fetcher<Data> | null,
	config?: SWRConfiguration<Data, Error>,
) =>
	useSWR(key, fetcher, {
		refreshWhenHidden: false,
		refreshWhenOffline: false,
		revalidateOnFocus: false,
		revalidateOnMount: false,
		revalidateOnReconnect: false,
		...config,
	});

export interface SWRRefreshParams<T, A = (...args: any[]) => any> {
	action: A;
	optimisticData?: (data: T | undefined) => T;
}

export type SWRefreshMethod<T> = <A extends (...args: any[]) => Promise<any>>(
	params?: SWRRefreshParams<T, A>,
) => ReturnType<A>;

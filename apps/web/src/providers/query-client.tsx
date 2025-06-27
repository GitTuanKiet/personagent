'use client';

import {
	QueryClient,
	QueryClientProvider as ReactQueryClientProvider,
} from '@tanstack/react-query';

const queryClient = new QueryClient();

export function QueryClientProvider(props: { children: React.ReactNode }) {
	return <ReactQueryClientProvider client={queryClient}>{props.children}</ReactQueryClientProvider>;
}

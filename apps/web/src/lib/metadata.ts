import type { Metadata } from 'next/types';

export function createMetadata(override: Metadata): Metadata {
	return {
		...override,
		openGraph: {
			title: override.title ?? undefined,
			description: override.description ?? undefined,
			siteName: 'Pag',
			...override.openGraph,
		},
		twitter: {
			card: 'summary_large_image',
			creator: '@gittuankiet',
			title: override.title ?? undefined,
			description: override.description ?? undefined,
			...override.twitter,
		},
	};
}

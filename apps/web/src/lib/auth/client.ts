import { createAuthClient } from 'better-auth/react';
import {
	passkeyClient,
	twoFactorClient,
	adminClient,
	multiSessionClient,
	anonymousClient,
	oneTapClient,
	oidcClient,
	genericOAuthClient,
} from 'better-auth/client/plugins';
import { toast } from 'sonner';
import { stripeClient } from '@better-auth/stripe/client';

export const client = createAuthClient({
	plugins: [
		twoFactorClient({
			onTwoFactorRedirect() {
				window.location.href = '/two-factor';
			},
		}),
		passkeyClient(),
		adminClient(),
		multiSessionClient(),
		anonymousClient(),
		oneTapClient({
			clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
			promptOptions: {
				maxAttempts: 1,
			},
		}),
		oidcClient(),
		genericOAuthClient(),
		stripeClient({
			subscription: true,
		}),
	],
	fetchOptions: {
		onError(e) {
			if (e.error.status === 429) {
				toast.error('Too many requests. Please try again later.');
			}
		},
	},
});

export const { signUp, signIn, signOut, useSession } = client;

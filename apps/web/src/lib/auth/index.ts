import { betterAuth } from 'better-auth';
import {
	bearer,
	admin,
	multiSession,
	twoFactor,
	oneTap,
	oAuthProxy,
	openAPI,
	anonymous,
} from 'better-auth/plugins';
import { passkey } from 'better-auth/plugins/passkey';
import { reactResetPasswordEmail } from './email/reset-password';
import { resend } from './email/resend';
import { nextCookies } from 'better-auth/next-js';
import { stripe } from '@better-auth/stripe';
import { Stripe } from 'stripe';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { serverDB } from '@/database/core';

const from = process.env.BETTER_AUTH_EMAIL || 'delivered@resend.dev';
const to = process.env.TEST_EMAIL || '';

const PROFESSION_PRICE_ID = {
	default: 'price_1QxWZ5LUjnrYIrml5Dnwnl0X',
	annual: 'price_1QxWZTLUjnrYIrmlyJYpwyhz',
};
const STARTER_PRICE_ID = {
	default: 'price_1QxWWtLUjnrYIrmleljPKszG',
	annual: 'price_1QxWYqLUjnrYIrmlonqPThVF',
};

export const auth = betterAuth({
	appName: 'Pag',
	database: drizzleAdapter(serverDB, { provider: 'pg' }),
	emailVerification: {
		async sendVerificationEmail({ user, url }) {
			const res = await resend.emails.send({
				from,
				to: to || user.email,
				subject: 'Verify your email address',
				html: `<a href="${url}">Verify your email address</a>`,
			});
			console.log(res, user.email);
		},
	},
	account: {
		accountLinking: {
			trustedProviders: ['google', 'github'],
		},
	},
	emailAndPassword: {
		enabled: true,
		async sendResetPassword({ user, url }) {
			await resend.emails.send({
				from,
				to: user.email,
				subject: 'Reset your password',
				react: reactResetPasswordEmail({
					username: user.email,
					resetLink: url,
				}),
			});
		},
	},
	// socialProviders: {
	// facebook: {
	//     clientId: process.env.FACEBOOK_CLIENT_ID || "",
	//     clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
	// },
	// github: {
	//     clientId: process.env.GITHUB_CLIENT_ID || "",
	//     clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
	// },
	// google: {
	//     clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
	//     clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
	// },
	// discord: {
	//     clientId: process.env.DISCORD_CLIENT_ID || "",
	//     clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
	// },
	// microsoft: {
	//     clientId: process.env.MICROSOFT_CLIENT_ID || "",
	//     clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
	// },
	// twitch: {
	//     clientId: process.env.TWITCH_CLIENT_ID || "",
	//     clientSecret: process.env.TWITCH_CLIENT_SECRET || "",
	// },
	// twitter: {
	//     clientId: process.env.TWITTER_CLIENT_ID || "",
	//     clientSecret: process.env.TWITTER_CLIENT_SECRET || "",
	// },
	// },
	plugins: [
		twoFactor({
			otpOptions: {
				async sendOTP({ user, otp }) {
					await resend.emails.send({
						from,
						to: user.email,
						subject: 'Your OTP',
						html: `Your OTP is ${otp}`,
					});
				},
			},
		}),
		passkey(),
		openAPI(),
		bearer(),
		admin({
			adminUserIds: ['EXD5zjob2SD6CBWcEQ6OpLRHcyoUbnaB'],
		}),
		multiSession(),
		anonymous(),
		oAuthProxy(),
		nextCookies(),

		oneTap({
			clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string,
		}),
		stripe({
			stripeClient: new Stripe(process.env.STRIPE_KEY || 'sk_test_'),
			stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
			subscription: {
				enabled: true,
				plans: [
					{
						name: 'Starter',
						priceId: STARTER_PRICE_ID.default,
						annualDiscountPriceId: STARTER_PRICE_ID.annual,
						freeTrial: {
							days: 7,
						},
					},
					{
						name: 'Professional',
						priceId: PROFESSION_PRICE_ID.default,
						annualDiscountPriceId: PROFESSION_PRICE_ID.annual,
					},
					{
						name: 'Enterprise',
					},
				],
			},
		}),
	],
	trustedOrigins: ['exp://'],
});

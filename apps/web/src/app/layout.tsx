import { Geist, Geist_Mono } from 'next/font/google';

import '@workspace/ui/globals.css';
import '@/styles/user-preferences.css';

import { ThemeProviders } from '@/providers/theme-providers';
import { TRPCProvider } from '@/providers/trpc-provider';
import { Toaster } from '@workspace/ui/components/sonner';

export const metadata = {
	title: 'AI-Powered UX Evaluation Platform',
	description: 'Automated user experience evaluation using AI agents',
};

const fontSans = Geist({
	subsets: ['latin'],
	variable: '--font-sans',
});

const fontMono = Geist_Mono({
	subsets: ['latin'],
	variable: '--font-mono',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased `}>
				<TRPCProvider>
					<ThemeProviders>
						{children}
						<Toaster />
					</ThemeProviders>
				</TRPCProvider>
			</body>
		</html>
	);
}

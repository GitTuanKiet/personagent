import { Geist, Geist_Mono } from 'next/font/google';

import '@workspace/ui/globals.css';

import { ThemeProviders } from '@/providers/theme';
import { Toaster } from '@workspace/ui/components/sonner';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

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
				<NuqsAdapter>
					<ThemeProviders>
						{children}
						<Toaster richColors closeButton />
					</ThemeProviders>
				</NuqsAdapter>
			</body>
		</html>
	);
}

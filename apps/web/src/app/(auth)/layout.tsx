'use client';

import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { Rocket } from 'lucide-react';
import { client } from '@/lib/auth/client';
import { Button } from '@workspace/ui/components/button';
import { useRouter } from 'next/navigation';

function SignInAnonymousButton() {
	const router = useRouter();
	const handleSignInAnonymous = async () => {
		const res = await client.signIn.anonymous();
		if (res instanceof Error) {
			console.error(res);
		} else {
			router.push('/playground');
		}
	};

	return (
		<Button className="gap-2  justify-between" variant="default" onClick={handleSignInAnonymous}>
			<span>Guest</span>
			<svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24">
				<path
					fill="currentColor"
					d="M5 3H3v4h2V5h14v14H5v-2H3v4h18V3zm12 8h-2V9h-2V7h-2v2h2v2H3v2h10v2h-2v2h2v-2h2v-2h2z"
				></path>
			</svg>
		</Button>
	);
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen w-full dark:bg-black bg-white  dark:bg-grid-small-white/[0.2] bg-grid-small-black/[0.2] relative flex justify-center">
			<div className="absolute pointer-events-none inset-0 md:flex items-center justify-center dark:bg-black bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] hidden"></div>
			<div className="bg-white dark:bg-black border-b py-2 flex justify-between items-center border-border absolute z-50 w-full lg:w-8/12 px-4 md:px-1">
				<Link href="/">
					<div className="flex gap-2 cursor-pointer">
						<Rocket />
						<p className="dark:text-white text-black">Pag</p>
					</div>
				</Link>
				<div className="z-50 flex items-center gap-2">
					<SignInAnonymousButton />
					<ThemeToggle />
				</div>
			</div>
			<div className="mt-20 lg:w-7/12 w-full">{children}</div>
		</div>
	);
}

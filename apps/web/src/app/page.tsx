import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function Home() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (session?.session) {
		redirect('/playground');
	} else {
		redirect('/sign-in');
	}
}

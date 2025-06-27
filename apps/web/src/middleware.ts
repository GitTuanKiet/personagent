import { type NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return NextResponse.redirect(new URL('/sign-in', request.url));
	}

	return NextResponse.next();
}

export const config = {
	runtime: 'nodejs',
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - authentication routes (sign-in, oauth, etc.)
		 */
		'/((?!_next/static|_next/image|favicon.ico|sign-in|forget-password|reset-password|oauth|two-factor|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
	],
};

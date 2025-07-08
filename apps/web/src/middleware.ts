import { type NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function middleware(request: NextRequest) {
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
		 */
		'/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
	],
};

import type { NextRequest, NextResponse } from 'next/server';

export async function createContext(opts: { req: NextRequest; res: NextResponse }) {
	return {
		req: opts.req,
		res: opts.res,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;

import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	let screenshotUrl = searchParams.get('streamUrl');

	if (!screenshotUrl) {
		return new Response(JSON.stringify({ error: 'streamUrl parameter is required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	// Replace internal hostname if running locally
	if (screenshotUrl.includes('agent')) {
		screenshotUrl = screenshotUrl.replace('agent', 'localhost');
	}

	try {
		const upstreamRes = await fetch(screenshotUrl);

		if (!upstreamRes.ok) {
			return new Response(JSON.stringify({ error: `Upstream error: ${upstreamRes.statusText}` }), {
				status: upstreamRes.status,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const contentType = upstreamRes.headers.get('content-type') || 'image/jpeg';
		const arrayBuffer = await upstreamRes.arrayBuffer();

		return new Response(arrayBuffer, {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'no-cache, no-store, must-revalidate',
				Pragma: 'no-cache',
				Expires: '0',
			},
		});
	} catch (err) {
		console.error('Error proxying screenshot:', err);
		return new Response(JSON.stringify({ error: 'Proxy error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}

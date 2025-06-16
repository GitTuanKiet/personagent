import { browserContainer, BrowserSession } from '@pag/langgraph-bua';

export async function GET() {
	const browserSession = browserContainer.get(BrowserSession);
	const page = browserSession.agentCurrentPage;
	if (!page) return new Response('No browser session', { status: 404 });

	const stream = new ReadableStream({
		async start(controller) {
			try {
				while (true) {
					const buffer = await page.screenshot({ type: 'jpeg', quality: 70 });
					controller.enqueue(
						new TextEncoder().encode(
							`--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${buffer.length}\r\n\r\n`,
						),
					);
					controller.enqueue(buffer);
					controller.enqueue(new TextEncoder().encode('\r\n'));
				}
			} catch (e) {
				controller.close();
			}
		},
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
		},
	});
}

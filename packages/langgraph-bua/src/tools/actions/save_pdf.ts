import { z } from 'zod';
import { DynamicStructuredAction, getBrowserInstance } from '../base';

export const savePdfAction = new DynamicStructuredAction({
	name: 'save_pdf',
	description: 'Save the current page as a PDF file',
	schema: z.object({}),
	func: async () => {
		const instance = getBrowserInstance();
		const page = await instance.getCurrentPage();
		const url = page.url();
		let shortUrl = url.replace(/^https?:\/\/(?:www\.)?/, '').replace(/\/$/, '');
		let slug = shortUrl
			.replace(/[^a-zA-Z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.toLowerCase();
		const sanitizedFilename = `${slug || 'page'}.pdf`;
		await page.emulateMedia({ media: 'screen' });
		await page.pdf({ path: sanitizedFilename, format: 'A4', printBackground: false });
		const msg = `Saving page with URL ${url} as PDF to ./${sanitizedFilename}`;
		console.info(msg);
		return msg;
	},
});

import { z } from 'zod';
import { DynamicStructuredAction, getBrowserInstance } from '../base';

export const getAxTreeAction = new DynamicStructuredAction({
	name: 'get_ax_tree',
	description:
		'Get the accessibility tree of the page in the format "role name" with the number_of_elements to return',
	schema: z.object({
		number_of_elements: z.number().describe('Number of elements to retrieve.'),
	}),
	func: async (input) => {
		const instance = getBrowserInstance();
		const page = await instance.getCurrentPage();
		const node = await page.accessibility.snapshot({ interestingOnly: true });
		function flattenAxTree(
			node: Awaited<ReturnType<typeof page.accessibility.snapshot>>,
			lines: string[],
		) {
			if (!node) return;
			const role = node.role || '';
			const name = node.name || '';
			lines.push(`${role} ${name}`);
			if (node.children) {
				for (const child of node.children) {
					flattenAxTree(child, lines);
				}
			}
		}
		const lines: string[] = [];
		flattenAxTree(node, lines);
		const msg = lines.slice(0, input.number_of_elements).join('\n');
		console.info(msg);
		return msg;
	},
});

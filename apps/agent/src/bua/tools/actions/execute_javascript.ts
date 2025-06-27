import { z } from 'zod';
import { DynamicStructuredAction } from '../base.js';

export const executeJavascriptAction = new DynamicStructuredAction({
	name: 'execute_javascript',
	description: 'Execute javascript',
	schema: z.object({
		script: z.string().describe('The javascript code to execute'),
	}),
	func: async (input, _runManager, config) => {
		const instance = await DynamicStructuredAction.getBrowserSession(config);
		await instance.executeJavascript(input.script);
		const msg = `💻  Executed JavaScript: ${input.script}`;
		return [{ type: 'text', text: msg }];
	},
});

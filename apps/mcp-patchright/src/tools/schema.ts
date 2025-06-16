import { z } from 'zod';

// 1. tab_manager
const TabManagerSchema = z
	.object({
		action: z.enum(['open', 'close', 'switch']).describe('The action to perform'),
		url: z.string().optional().describe('The URL to navigate to. Required if action is open'),
		tab_id: z
			.number()
			.optional()
			.describe('The tab ID to switch to. Required if action is switch, close'),
	})
	.superRefine((val, ctx) => {
		if (val.action === 'open' && !val.url) {
			ctx.addIssue({
				path: ['url'],
				code: z.ZodIssueCode.custom,
				message: 'url is required when action is "open"',
			});
		}
		if ((val.action === 'switch' || val.action === 'close') && val.tab_id === undefined) {
			ctx.addIssue({
				path: ['tab_id'],
				code: z.ZodIssueCode.custom,
				message: 'tab_id is required when action is "switch" or "close"',
			});
		}
	})
	.describe('Manage tabs for the browser session');

// 2. wait
const WaitSchema = z
	.object({
		seconds: z.number().default(3).describe('The number of seconds to wait, default is 3'),
	})
	.describe('Wait for a specified time');

// 3. navigate_or_back
const NavigateOrBackSchema = z
	.object({
		action: z.enum(['go_back', 'to_url']).describe('The action to perform'),
		to_url: z.string().optional().describe('The URL to navigate to. Required if action is to_url'),
		wait_until: z
			.enum(['load', 'domcontentloaded', 'networkidle'])
			.default('networkidle')
			.describe('The wait until condition'),
	})
	.superRefine((val, ctx) => {
		if (val.action === 'to_url' && !val.to_url) {
			ctx.addIssue({
				path: ['to_url'],
				code: z.ZodIssueCode.custom,
				message: 'to_url is required when action is "to_url"',
			});
		}
	})
	.describe('Navigate to a URL or go back');

// 4. get_content
const GetContentSchema = z
	.object({
		content_type: z
			.enum(['page', 'ax_tree'])
			.default('page')
			.describe('The type of content to get'),
		include_links: z
			.boolean()
			.optional()
			.default(false)
			.describe('Whether to include links in the output. Only used if content_type is page'),
		number_of_elements: z
			.number()
			.optional()
			.default(10)
			.describe('The number of elements to get. Only used if content_type is ax_tree'),
	})
	.describe('Get the content of the page or the accessibility tree');

// 5. click_element_by_index
const ClickElementByIndexSchema = z
	.object({
		index: z.number().describe('The index of the element to click'),
	})
	.describe('Click an element by index');

// 6. input_text
const InputTextSchema = z
	.object({
		index: z.number().describe('The index of the element to input text into'),
		text: z.string().describe('The text to input into the element'),
	})
	.describe('Input text into an element');

// 7. scroll
const ScrollSchema = z
	.object({
		direction: z.enum(['up', 'down', 'to_text']).describe('The direction to scroll'),
		to_text: z
			.string()
			.optional()
			.describe('The text to scroll to. Required if direction is to_text'),
		pixel: z
			.number()
			.optional()
			.describe('The pixel amount to scroll. If none is given, scroll one page'),
	})
	.superRefine((val, ctx) => {
		if (val.direction === 'to_text' && !val.to_text) {
			ctx.addIssue({
				path: ['to_text'],
				code: z.ZodIssueCode.custom,
				message: 'to_text is required when direction is "to_text"',
			});
		}
	})
	.describe('Scroll the page');

// 8. execute_javascript
const ExecuteJavascriptSchema = z
	.object({
		script: z.string().describe('The javascript code to execute'),
	})
	.describe('Execute javascript');

// 9. send_keys
const SendKeysSchema = z
	.object({
		keys: z.string().describe('The keys to send to the page'),
	})
	.describe('Send keys to the page');

// 10. dropdown_options
const DropdownOptionsSchema = z
	.object({
		action: z.enum(['get_options', 'select_option']).describe('The action to perform'),
		index: z.number().describe('The index of the dropdown to get options from.'),
		text: z
			.string()
			.optional()
			.describe('The text of the option to select. Required if action is select_option'),
	})
	.superRefine((val, ctx) => {
		if (val.action === 'select_option' && !val.text) {
			ctx.addIssue({
				path: ['text'],
				code: z.ZodIssueCode.custom,
				message: 'text is required when action is "select_option"',
			});
		}
	})
	.describe('Get dropdown options');

// 11. drag_drop
const DragDropSchema = z
	.object({
		element_source: z
			.string()
			.nullable()
			.optional()
			.describe('CSS selector or XPath of the element to drag from'),
		element_target: z
			.string()
			.nullable()
			.optional()
			.describe('CSS selector or XPath of the element to drop onto'),
		element_source_offset: z
			.object({
				x: z.number(),
				y: z.number(),
			})
			.nullable()
			.optional()
			.describe(
				'Precise position within the source element to start drag (in pixels from top-left corner)',
			),
		element_target_offset: z
			.object({
				x: z.number(),
				y: z.number(),
			})
			.nullable()
			.optional()
			.describe(
				'Precise position within the target element to drop (in pixels from top-left corner)',
			),
		coord_source_x: z
			.number()
			.nullable()
			.optional()
			.describe('Absolute X coordinate on page to start drag from (in pixels)'),
		coord_source_y: z
			.number()
			.nullable()
			.optional()
			.describe('Absolute Y coordinate on page to start drag from (in pixels)'),
		coord_target_x: z
			.number()
			.nullable()
			.optional()
			.describe('Absolute X coordinate on page to drop at (in pixels)'),
		coord_target_y: z
			.number()
			.nullable()
			.optional()
			.describe('Absolute Y coordinate on page to drop at (in pixels)'),
		steps: z
			.number()
			.min(1)
			.max(20)
			.default(10)
			.nullable()
			.optional()
			.describe('Number of intermediate points for smoother movement (5-20 recommended)'),
		delay_ms: z
			.number()
			.min(0)
			.max(20)
			.default(5)
			.nullable()
			.optional()
			.describe('Delay in milliseconds between steps (0 for fastest, 10-20 for more natural)'),
	})
	.describe('Drag and drop an element');

export const ToolSchemas = {
	tab_manager: TabManagerSchema,
	wait: WaitSchema,
	navigate_or_back: NavigateOrBackSchema,
	get_content: GetContentSchema,
	click_element_by_index: ClickElementByIndexSchema,
	input_text: InputTextSchema,
	scroll: ScrollSchema,
	execute_javascript: ExecuteJavascriptSchema,
	send_keys: SendKeysSchema,
	dropdown_options: DropdownOptionsSchema,
	drag_drop: DragDropSchema,
};

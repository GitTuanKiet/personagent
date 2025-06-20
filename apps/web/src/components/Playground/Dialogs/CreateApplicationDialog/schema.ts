import { z } from 'zod';

export const applicationFormSchema = z.object({
	name: z
		.string()
		.min(1, 'Name is required')
		.min(2, 'Name must be at least 2 characters')
		.max(50, 'Name must be less than 50 characters')
		.regex(
			/^[a-zA-Z0-9\s\-_]+$/,
			'Name can only contain letters, numbers, spaces, hyphens, and underscores',
		),

	description: z.string().max(500, 'Description must be less than 500 characters'),

	allowedDomains: z.array(
		z
			.string()
			.min(1, 'Domain cannot be empty')
			.refine((url) => {
				try {
					new URL(url);
					return true;
				} catch {
					return false;
				}
			}, 'Invalid URL format'),
	),

	headers: z.record(z.string(), z.string()),

	timeout: z
		.number()
		.min(1000, 'Timeout must be at least 1 second')
		.max(600000, 'Timeout must be less than 10 minutes'),

	recursionLimit: z
		.number()
		.min(1, 'Recursion limit must be at least 1')
		.max(1000, 'Recursion limit must be less than 1000'),

	useVision: z.boolean(),

	env: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),

	pinned: z.boolean(),
});

export type ApplicationFormData = z.infer<typeof applicationFormSchema>;

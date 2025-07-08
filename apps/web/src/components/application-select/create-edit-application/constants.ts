import { z } from 'zod';

export const createApplicationSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	url: z.string().url('Invalid URL'),
	headers: z.record(z.string()).optional().default({}),
	cookies: z.string().optional().default(''),
});

export type CreateApplicationData = z.infer<typeof createApplicationSchema>;

export const DEFAULT_APPLICATION_DATA: CreateApplicationData = {
	name: '',
	url: '',
	headers: {},
	cookies: '',
};

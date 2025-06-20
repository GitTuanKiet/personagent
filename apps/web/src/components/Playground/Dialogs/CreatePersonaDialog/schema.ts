import { z } from 'zod';

const ageGroupEnum = z.enum(['teen', 'adult', 'senior']);
const digitalSkillLevelEnum = z.enum(['low', 'medium', 'high']);

export const personaFormSchema = z.object({
	name: z
		.string()
		.min(1, 'Name is required')
		.min(2, 'Name must be at least 2 characters')
		.max(50, 'Name must be less than 50 characters')
		.regex(/^[a-zA-Z0-9\s\-_',.]+$/, 'Name contains invalid characters'),

	description: z.string().max(500, 'Description must be less than 500 characters'),

	ageGroup: z.union([ageGroupEnum, z.literal('')]),

	digitalSkillLevel: z.union([digitalSkillLevelEnum, z.literal('')]),

	behaviorTraits: z.array(z.string()),

	preferences: z.record(z.string(), z.any()),

	language: z.enum(['vietnamese', 'english']),

	pinned: z.boolean(),
});

export type PersonaFormData = z.infer<typeof personaFormSchema>;

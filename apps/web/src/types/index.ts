import { BaseMessage } from '@langchain/core/messages';
import type { ToolCall } from '@langchain/core/messages/tool';
import type { Thread as ThreadType } from '@langchain/langgraph-sdk';
import { z } from 'zod';

export type BrowserToolCall = Omit<ToolCall, 'name'> & {
	name: string;
};

const baseFieldSchema = z.object({
	name: z
		.string()
		.min(1, 'Name is required')
		.min(2, 'Name must be at least 2 characters')
		.max(50, 'Name must be less than 50 characters')
		.regex(
			/^[a-zA-Z0-9\s\-_]+$/,
			'Name can only contain letters, numbers, spaces, hyphens, and underscores',
		),
	description: z.string().max(500, 'Description must be less than 500 characters').optional(),
});

// ============================================
// APPLICATION SCHEMAS & TYPES
// ============================================

// Icon Data Schema
export const iconDataSchema = z.object({
	iconName: z.string().min(1, 'Icon name is required'),
	iconColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
	emoji: z.string().optional(),
});

// Browser Profile Schema
export const browserProfileSchema = z.object({
	blockedDomains: z.array(z.string()).optional(),
	allowedDomains: z.array(z.string()).optional(),
	extraHTTPHeaders: z.record(z.string(), z.string()).optional(),
});

// Application Create Schema (used by both frontend and backend)
export const createApplicationSchema = z.object({
	...baseFieldSchema.shape,
	iconData: iconDataSchema.optional(),
	useVision: z.boolean().default(false),
	recursionLimit: z
		.number()
		.min(1, 'Recursion limit must be at least 1')
		.max(1000, 'Recursion limit must be less than 1000')
		.default(50),
	browserProfile: browserProfileSchema.optional(),
	isActive: z.boolean().default(true),
});

// Application Update Schema
export const updateApplicationSchema = createApplicationSchema.partial();

// ============================================================================
// ASSISTANT SCHEMAS
// ============================================================================

// Assistant Enums
export const ageGroupEnum = z.enum(['teen', 'adult', 'senior']);
export const digitalSkillLevelEnum = z.enum(['low', 'medium', 'high']);

export const behaviorTraitEnum = z.union([
	z.enum([
		'cautious',
		'impatient',
		'detail-oriented',
		'exploratory',
		'task-focused',
		'distracted',
		'hesitatesWithForms',
		'ignoresSmallText',
		'scrollAverse',
		'prefersTextOverIcon',
	]),
	z.string(),
]);

export const languageEnum = z.enum(['vietnamese', 'english']);

// Assistant Form Schema (used by both frontend and backend)
export const createAssistantSchema = z.object({
	...baseFieldSchema.shape,
	iconData: iconDataSchema,
	ageGroup: z.union([ageGroupEnum, z.undefined()]).optional(),
	digitalSkillLevel: z.union([digitalSkillLevelEnum, z.undefined()]).optional(),
	behaviorTraits: z.array(behaviorTraitEnum),
	preferences: z.record(z.string(), z.any()),
	language: languageEnum,
	isDefault: z.boolean().default(false),
});

// Assistant Update Schema
export const updateAssistantSchema = createAssistantSchema.partial();

// Inferred Types
export type IconData = z.infer<typeof iconDataSchema>;
export type BrowserProfile = z.infer<typeof browserProfileSchema>;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Application Types
export type CreateApplicationData = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationData = z.infer<typeof updateApplicationSchema>;

// Application Interface (matches database schema)
export interface Application extends CreateApplicationData {
	id: string;
	createdAt: Date;
	updatedAt: Date;
}

// Assistant Types
export type PersonaAgeGroup = z.infer<typeof ageGroupEnum>;
export type PersonaDigitalSkillLevel = z.infer<typeof digitalSkillLevelEnum>;
export type PersonaBehaviorTrait = z.infer<typeof behaviorTraitEnum>;
export type PersonaLanguage = z.infer<typeof languageEnum>;

export type CreatePersonaData = z.infer<typeof createAssistantSchema>;
export type UpdatePersonaData = z.infer<typeof updateAssistantSchema>;

// Assistant Interface (matches database schema)
export interface Persona extends CreatePersonaData {
	id: string;
	createdAt: Date;
	updatedAt: Date;
}

// ============================================
// PERSONA SCHEMAS & TYPES
// ============================================

export interface UsabilityIssue {
	title?: string;
	description: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
	impact: 'minor' | 'moderate' | 'major' | 'blocker';
	recommendation: string;
	context: string;
	category: 'navigation' | 'forms' | 'content' | 'accessibility' | 'errors' | 'performance';
	element?: string;
	stepIndex?: number;
}

export interface Simulation {
	messages: BaseMessage[];
	actions: BrowserToolCall[];
	scripts: Record<number, BrowserToolCall[]>;
	nSteps: number;
	streamUrl?: string;
	isDone: boolean;
	isSimulatedPrompt?: boolean;
	usabilityIssues?: UsabilityIssue[];
}

export type Thread = ThreadType<Simulation>;

export interface GraphInput {
	messages?: Record<string, any>[];
}

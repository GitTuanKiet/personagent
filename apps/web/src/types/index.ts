import { BaseMessage } from '@langchain/core/messages';
import type { ToolCall } from '@langchain/core/messages/tool';
import type { Thread as ThreadType } from '@langchain/langgraph-sdk';
import { z } from 'zod';

export type BrowserToolCall = Omit<ToolCall, 'name'> & {
	name: string;
};

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
	iconData: z.object({
		iconName: z.string().min(1, 'Icon name is required'),
		iconColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
	}),
	ageGroup: z.union([ageGroupEnum, z.undefined()]).optional(),
	digitalSkillLevel: z.union([digitalSkillLevelEnum, z.undefined()]).optional(),
	behaviorTraits: z.array(behaviorTraitEnum),
	preferences: z.record(z.string(), z.any()),
	language: languageEnum,
	isDefault: z.boolean().default(false),
});

// Assistant Update Schema
export const updateAssistantSchema = createAssistantSchema.partial();
4;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

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

export interface ThreadState {
	messages: BaseMessage[];
	actions: BrowserToolCall[];
	scripts: Record<number, BrowserToolCall[]>;
	nSteps: number;
	streamUrl?: string;
	isDone: boolean;
	isSimulatedPrompt?: boolean;
	usabilityIssues?: UsabilityIssue[];
}

export type Thread = ThreadType<ThreadState>;

export interface GraphInput {
	messages?: Record<string, any>[];
}

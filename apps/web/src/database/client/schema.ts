import { pgTable, serial, text, timestamp, jsonb, integer, boolean } from 'drizzle-orm/pg-core';
import type { BUAState } from '@pag/langgraph-bua';
import type { Cookie, HTTPCredentials } from 'playwright';

const timestampz = (name?: string) =>
	(name ? timestamp(name, { withTimezone: true }) : timestamp({ withTimezone: true }))
		.defaultNow()
		.notNull();

const baseColumns = {
	id: serial().primaryKey(),
	fingerprint: text().notNull(),
	createdAt: timestampz(),
	updatedAt: timestampz().$onUpdateFn(() => new Date()),
};

export type AgeGroup = 'teen' | 'adult' | 'senior';
export type DigitalSkillLevel = 'low' | 'medium' | 'high';
export type BehaviorTrait =
	| 'cautious'
	| 'impatient'
	| 'detail-oriented'
	| 'exploratory'
	| 'task-focused'
	| 'distracted'
	| 'hesitatesWithForms'
	| 'ignoresSmallText'
	| 'scrollAverse'
	| 'prefersTextOverIcon'
	| string;

// PERSONAS TABLE
export const personas = pgTable('personas', {
	name: text().notNull().unique(),
	description: text(),

	ageGroup: text().$type<AgeGroup>(),
	digitalSkillLevel: text().$type<DigitalSkillLevel>(),
	behaviorTraits: text().array().$type<BehaviorTrait[]>(),
	preferences: jsonb(),

	pinned: boolean().notNull().default(false),
	...baseColumns,
});

export type PersonaSelect = typeof personas.$inferSelect;
export type PersonaInsert = Omit<
	typeof personas.$inferInsert,
	'id' | 'fingerprint' | 'createdAt' | 'updatedAt'
>;

// APPLICATIONS TABLE
export const applications = pgTable('applications', {
	name: text().notNull().unique(),
	description: text(),
	headers: jsonb().$type<{ [key: string]: string }>(),
	cookies: jsonb().$type<Cookie[]>(),
	credentials: jsonb().$type<HTTPCredentials>(),
	timeout: integer().notNull().default(30000),
	env: jsonb().$type<{ [key: string]: string | number | boolean }>(),
	allowedDomains: text().array().notNull(),
	wssUrl: text(),
	cdpUrl: text(),
	recursionLimit: integer().notNull().default(100),
	useVision: boolean().notNull().default(false),

	pinned: boolean().notNull().default(false),
	...baseColumns,
});

export type ApplicationSelect = typeof applications.$inferSelect;
export type ApplicationInsert = Omit<
	typeof applications.$inferInsert,
	'id' | 'fingerprint' | 'createdAt' | 'updatedAt'
>;

// SIMULATIONS TABLE
export type SimulationStatus = 'idle' | 'running' | 'completed' | 'failed' | 'stopped';

export const simulations = pgTable('simulations', {
	personaId: integer()
		.references(() => personas.id)
		.notNull(),
	applicationId: integer()
		.references(() => applications.id)
		.notNull(),
	task: text().notNull(),
	status: text().$type<SimulationStatus>().notNull().default('idle'),
	state: jsonb().$type<BUAState>(),

	pinned: boolean().notNull().default(false),
	...baseColumns,
});

export type SimulationSelect = typeof simulations.$inferSelect;
export type SimulationInsert = Omit<
	typeof simulations.$inferInsert,
	'id' | 'fingerprint' | 'createdAt' | 'updatedAt'
>;

// USABILITY ISSUES TABLE
export enum UsabilitySeverity {
	Low = 'low',
	Medium = 'medium',
	High = 'high',
	Critical = 'critical',
}

export enum UsabilityImpact {
	Minor = 'minor',
	Moderate = 'moderate',
	Major = 'major',
	Blocker = 'blocker',
}

export const usabilityIssues = pgTable('usability_issues', {
	simulationId: integer()
		.references(() => simulations.id)
		.notNull(),
	personaId: integer()
		.references(() => personas.id)
		.notNull(),

	description: text().notNull(),
	recommendation: text(),

	severity: text().$type<UsabilitySeverity>(),
	impact: text().$type<UsabilityImpact>(),

	extra: jsonb(),

	...baseColumns,
});

export type UsabilityIssueSelect = typeof usabilityIssues.$inferSelect;
export type UsabilityIssueInsert = Omit<
	typeof usabilityIssues.$inferInsert,
	'id' | 'fingerprint' | 'createdAt' | 'updatedAt'
>;

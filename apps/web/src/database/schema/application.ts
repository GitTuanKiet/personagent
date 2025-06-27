import { pgTable, uuid, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { user } from './auth';
import type { Application } from '@/types';

export const application = pgTable('application', {
	userId: text('user_id')
		.references(() => user.id)
		.notNull(),
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	description: text('description'),
	iconData: jsonb('icon_data').$type<Application['iconData']>(),
	useVision: boolean('use_vision').notNull().default(false),
	recursionLimit: integer('recursion_limit').notNull().default(10),
	browserProfile: jsonb('browser_profile').$type<Application['browserProfile']>(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	isActive: boolean('is_active').notNull().default(true),
});

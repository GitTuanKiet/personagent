import { sql, eq, and } from 'drizzle-orm';
import { serverDB } from '@/database/core';
import { application } from '@/database/schema/application';
import type { CreateApplicationData, UpdateApplicationData } from '@/types';

export const queries = {
	// Get all applications for a user
	getUserApplications: () =>
		serverDB
			.select()
			.from(application)
			.where(eq(application.userId, sql.placeholder('userId')))
			.prepare('getUserApplications'),

	// Get application by ID and user ID
	getApplicationById: () =>
		serverDB
			.select()
			.from(application)
			.where(
				and(
					eq(application.id, sql.placeholder('id')),
					eq(application.userId, sql.placeholder('userId')),
				),
			)
			.prepare('getApplicationById'),

	// Check if application exists and belongs to user
	checkApplicationOwnership: () =>
		serverDB
			.select({ id: application.id })
			.from(application)
			.where(
				and(
					eq(application.id, sql.placeholder('id')),
					eq(application.userId, sql.placeholder('userId')),
				),
			)
			.prepare('checkApplicationOwnership'),

	// Insert application
	insertApplication: (userId: string, data: CreateApplicationData) => {
		const insertData = {
			userId,
			name: data.name,
			description: data.description,
			iconData: data.iconData,
			useVision: data.useVision ?? false,
			recursionLimit: data.recursionLimit ?? 10,
			browserProfile: data.browserProfile,
			isActive: data.isActive ?? true,
		};

		return serverDB.insert(application).values(insertData).returning();
	},

	// Update application
	updateApplication: (id: string, userId: string, updateData: UpdateApplicationData) => {
		return serverDB
			.update(application)
			.set({
				...updateData,
			})
			.where(and(eq(application.id, id), eq(application.userId, userId)))
			.returning();
	},

	// Delete application
	deleteApplication: (id: string, userId: string) => {
		return serverDB
			.delete(application)
			.where(and(eq(application.id, id), eq(application.userId, userId)))
			.returning();
	},
};

import { clientDB } from '@/database/client';
import {
	usabilityIssues,
	type UsabilityIssueSelect,
	type UsabilityIssueInsert,
	type UsabilityType,
	type UsabilitySeverity,
	type UsabilityImpact,
} from '@/database/client/schema';
import { eq, inArray, and, ilike, desc, asc, sql } from 'drizzle-orm';
import { getVisitorId } from '@/store/user';

export interface UsabilityIssueQueryParams {
	ids?: number[];
	simulationId?: number;
	type?: UsabilityType;
	severity?: UsabilitySeverity;
	impact?: UsabilityImpact;
	tags?: string[];
	detectedByPersonaId?: number;
	search?: string;
	fromDate?: Date;
	toDate?: Date;
	order?: 'asc' | 'desc';
	limit?: number;
	offset?: number;
}

class UsabilityIssueService {
	async getAll() {
		return await clientDB.select().from(usabilityIssues);
	}

	async getById(id: number) {
		const [issue] = await clientDB
			.select()
			.from(usabilityIssues)
			.where(this.prepareFilter({ ids: [id] }))
			.limit(1);
		return issue;
	}

	async add(data: UsabilityIssueInsert) {
		const [inserted] = await clientDB
			.insert(usabilityIssues)
			.values({ ...data, fingerprint: getVisitorId() })
			.returning();
		return inserted!;
	}

	async update(id: number, data: Partial<UsabilityIssueInsert>) {
		const existing = await this.getById(id);
		if (!existing) throw new Error('Usability issue not found');
		const [updated] = await clientDB
			.update(usabilityIssues)
			.set({ ...data, updatedAt: new Date() })
			.where(this.prepareFilter({ ids: [id] }))
			.returning();
		return updated!;
	}

	async remove(id: number) {
		await clientDB.delete(usabilityIssues).where(this.prepareFilter({ ids: [id] }));
	}

	async countBy(filter: Partial<UsabilityIssueQueryParams> = {}) {
		const whereClause = this.prepareFilter(filter);
		const result = await clientDB
			.select({ count: sql<number>`count(*)` })
			.from(usabilityIssues)
			.where(whereClause);
		return result[0]?.count ?? 0;
	}

	async hasMoreThanN(n: number, filter: Partial<UsabilityIssueQueryParams> = {}) {
		const whereClause = this.prepareFilter(filter);
		const result = await clientDB
			.select({ id: usabilityIssues.id })
			.from(usabilityIssues)
			.where(whereClause)
			.limit(n + 1);
		return result.length > n;
	}

	async bulkInsert(list: UsabilityIssueInsert[]) {
		const fingerprint = getVisitorId();
		return clientDB
			.insert(usabilityIssues)
			.values(list.map((item) => ({ ...item, fingerprint })))
			.returning();
	}

	async bulkDelete(ids: number[]) {
		return clientDB.delete(usabilityIssues).where(this.prepareFilter({ ids }));
	}

	async queryBy(params: UsabilityIssueQueryParams) {
		const { limit = 20, offset = 0, order = 'desc' } = params;

		const whereClause = this.prepareFilter(params);

		const orderByClause =
			order === 'asc' ? asc(usabilityIssues.createdAt) : desc(usabilityIssues.createdAt);

		const data = await clientDB
			.select()
			.from(usabilityIssues)
			.where(whereClause)
			.orderBy(orderByClause)
			.limit(limit)
			.offset(offset);

		const totalCount = await this.countBy(params);

		return {
			totalCount,
			hasMore: totalCount > limit + offset,
			data,
			firstId: data[0]?.id,
			lastId: data[data.length - 1]?.id,
		};
	}

	private prepareFilter(params: Partial<UsabilityIssueQueryParams> = {}) {
		const conditions = [];
		conditions.push(eq(usabilityIssues.fingerprint, getVisitorId()));
		if (params.ids && params.ids.length > 0) {
			if (params.ids.length === 1) {
				conditions.push(eq(usabilityIssues.id, params.ids[0]!));
			} else {
				conditions.push(inArray(usabilityIssues.id, params.ids));
			}
		}
		if (params.simulationId) conditions.push(eq(usabilityIssues.simulationId, params.simulationId));
		if (params.type) conditions.push(eq(usabilityIssues.type, params.type));
		if (params.severity) conditions.push(eq(usabilityIssues.severity, params.severity));
		if (params.impact) conditions.push(eq(usabilityIssues.impact, params.impact));
		if (params.detectedByPersonaId)
			conditions.push(eq(usabilityIssues.detectedByPersonaId, params.detectedByPersonaId));
		if (params.tags && params.tags.length)
			conditions.push(sql`${usabilityIssues.tags} && ${params.tags}`);
		if (params.fromDate) conditions.push(sql`${usabilityIssues.createdAt} >= ${params.fromDate}`);
		if (params.toDate) conditions.push(sql`${usabilityIssues.createdAt} <= ${params.toDate}`);
		if (params.search) {
			conditions.push(ilike(usabilityIssues.description, `%${params.search}%`));
		}
		return and(...conditions);
	}
}

export const usabilityIssueService = new UsabilityIssueService();

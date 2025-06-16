import { clientDB } from '@/database/client';
import {
	applications,
	type ApplicationSelect,
	type ApplicationInsert,
} from '@/database/client/schema';
import { eq, inArray, and, ilike, desc, asc, sql } from 'drizzle-orm';
import { getVisitorId } from '@/store/user';

export interface ApplicationQueryParams {
	ids?: number[];
	name?: string;
	model?: string;
	useVision?: boolean;
	search?: string;
	fromDate?: Date;
	toDate?: Date;
	order?: 'asc' | 'desc';
	limit?: number;
	offset?: number;
}

class ApplicationService {
	async togglePin(id: number) {
		const existing = await this.getById(id);
		if (!existing) {
			throw new Error('Application not found');
		}
		const updated = await clientDB.transaction(async (tx) => {
			if (existing.pinned === false) {
				await tx.update(applications).set({ pinned: false }).where(eq(applications.pinned, true));
			}

			const [updated] = await tx
				.update(applications)
				.set({ pinned: !existing.pinned })
				.where(eq(applications.id, id))
				.returning();

			return updated!;
		});

		return updated!;
	}

	async existsName(name: string) {
		const [application] = await clientDB
			.select()
			.from(applications)
			.where(eq(applications.name, name))
			.limit(1);
		return application !== undefined;
	}

	async getAll(): Promise<ApplicationSelect[]> {
		return await clientDB.select().from(applications);
	}

	async getById(id: number): Promise<ApplicationSelect | undefined> {
		const [application] = await clientDB
			.select()
			.from(applications)
			.where(this.prepareFilter({ ids: [id] }))
			.limit(1);
		return application;
	}

	async add(data: ApplicationInsert): Promise<ApplicationSelect> {
		const [inserted] = await clientDB
			.insert(applications)
			.values({ ...data, fingerprint: getVisitorId() })
			.returning();
		return inserted!;
	}

	async update(id: number, data: Partial<ApplicationInsert>): Promise<ApplicationSelect> {
		const existing = await this.getById(id);
		if (!existing) {
			throw new Error('Application not found');
		}
		const [updated] = await clientDB
			.update(applications)
			.set({ ...data })
			.where(this.prepareFilter({ ids: [id] }))
			.returning();
		return updated!;
	}

	async remove(id: number): Promise<void> {
		await clientDB.delete(applications).where(this.prepareFilter({ ids: [id] }));
	}

	async countBy(filter: Partial<ApplicationQueryParams> = {}) {
		const whereClause = this.prepareFilter(filter);
		const result = await clientDB
			.select({ count: sql<number>`count(*)` })
			.from(applications)
			.where(whereClause);
		return result[0]?.count ?? 0;
	}

	async hasMoreThanN(n: number, filter: Partial<ApplicationQueryParams> = {}) {
		const whereClause = this.prepareFilter(filter);
		const result = await clientDB
			.select({ id: applications.id })
			.from(applications)
			.where(whereClause)
			.limit(n + 1);
		return result.length > n;
	}

	async bulkInsert(list: ApplicationInsert[]) {
		const fingerprint = getVisitorId();
		return clientDB
			.insert(applications)
			.values(list.map((item) => ({ ...item, fingerprint })))
			.returning();
	}

	async bulkDelete(ids: number[]) {
		return clientDB.delete(applications).where(this.prepareFilter({ ids }));
	}

	async queryBy(params: ApplicationQueryParams) {
		const { limit = 20, offset = 0, order = 'desc' } = params;

		const whereClause = this.prepareFilter(params);

		const orderByClause =
			order === 'asc' ? asc(applications.createdAt) : desc(applications.createdAt);

		const data = await clientDB
			.select()
			.from(applications)
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

	private prepareFilter(params: Partial<ApplicationQueryParams> = {}) {
		const conditions = [];
		conditions.push(eq(applications.fingerprint, getVisitorId()));
		if (params.ids && params.ids.length > 0) {
			if (params.ids.length === 1) {
				conditions.push(eq(applications.id, params.ids[0]!));
			} else {
				conditions.push(inArray(applications.id, params.ids));
			}
		}
		if (params.name) conditions.push(eq(applications.name, params.name));
		if (typeof params.useVision === 'boolean')
			conditions.push(eq(applications.useVision, params.useVision));
		if (params.fromDate) conditions.push(sql`${applications.createdAt} >= ${params.fromDate}`);
		if (params.toDate) conditions.push(sql`${applications.createdAt} <= ${params.toDate}`);
		if (params.search) {
			conditions.push(ilike(applications.name, `%${params.search}%`));
		}
		return and(...conditions);
	}
}

export const applicationService = new ApplicationService();

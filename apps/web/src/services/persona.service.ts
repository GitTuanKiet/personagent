import { clientDB } from '@/database/client';
import { personas, type PersonaSelect, type PersonaInsert } from '@/database/client/schema';
import { eq, inArray, and, ilike, desc, asc, sql } from 'drizzle-orm';
import { getVisitorId } from '@/store/user';

export interface PersonaQueryParams {
	ids?: number[];
	name?: string;
	search?: string;
	fromDate?: Date;
	toDate?: Date;
	order?: 'asc' | 'desc';
	limit?: number;
	offset?: number;
}

class PersonaService {
	async togglePin(id: number) {
		const existing = await this.getById(id);
		if (!existing) {
			throw new Error('Persona not found');
		}
		const updated = await clientDB.transaction(async (tx) => {
			// Always unpin all personas first
			await tx.update(personas).set({ pinned: false }).where(eq(personas.pinned, true));
			// Then pin the specified persona
			const [updated] = await tx
				.update(personas)
				.set({ pinned: true })
				.where(eq(personas.id, id))
				.returning();
			return updated!;
		});
		return updated!;
	}

	async existsName(name: string) {
		const [persona] = await clientDB
			.select()
			.from(personas)
			.where(eq(personas.name, name))
			.limit(1);
		return persona !== undefined;
	}

	async getById(id: number): Promise<PersonaSelect | undefined> {
		const [persona] = await clientDB
			.select()
			.from(personas)
			.where(this.prepareFilter({ ids: [id] }))
			.limit(1);
		return persona;
	}

	async add(data: PersonaInsert): Promise<PersonaSelect> {
		const [inserted] = await clientDB
			.insert(personas)
			.values({ ...data, fingerprint: getVisitorId() })
			.returning();
		return inserted!;
	}

	async update(id: number, data: Partial<PersonaInsert>): Promise<PersonaSelect> {
		const existing = await this.getById(id);
		if (!existing) {
			throw new Error('Persona not found');
		}
		const [updated] = await clientDB
			.update(personas)
			.set({ ...data })
			.where(this.prepareFilter({ ids: [id] }))
			.returning();
		return updated!;
	}

	async remove(id: number): Promise<void> {
		await clientDB.delete(personas).where(this.prepareFilter({ ids: [id] }));
	}

	async countBy(filter: Partial<PersonaQueryParams> = {}) {
		const whereClause = this.prepareFilter(filter);
		const result = await clientDB
			.select({ count: sql<number>`count(*)` })
			.from(personas)
			.where(whereClause);
		return result[0]?.count ?? 0;
	}

	async hasMoreThanN(n: number, filter: Partial<PersonaQueryParams> = {}) {
		const whereClause = this.prepareFilter(filter);
		const result = await clientDB
			.select({ id: personas.id })
			.from(personas)
			.where(whereClause)
			.limit(n + 1);
		return result.length > n;
	}

	async bulkInsert(list: PersonaInsert[]) {
		const fingerprint = getVisitorId();
		return clientDB
			.insert(personas)
			.values(list.map((item) => ({ ...item, fingerprint })))
			.returning();
	}

	async bulkDelete(ids: number[]) {
		return clientDB.delete(personas).where(this.prepareFilter({ ids }));
	}

	async queryBy(params: PersonaQueryParams) {
		const { limit = 20, offset = 0, order = 'desc' } = params;

		const whereClause = this.prepareFilter(params);

		const orderByClause = order === 'asc' ? asc(personas.createdAt) : desc(personas.createdAt);

		const data = await clientDB
			.select()
			.from(personas)
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

	private prepareFilter(params: Partial<PersonaQueryParams> = {}) {
		const conditions = [];
		conditions.push(eq(personas.fingerprint, getVisitorId()));
		if (params.ids && params.ids.length > 0) {
			if (params.ids.length === 1) {
				conditions.push(eq(personas.id, params.ids[0]!));
			} else {
				conditions.push(inArray(personas.id, params.ids));
			}
		}
		if (params.name) conditions.push(eq(personas.name, params.name));
		if (params.fromDate) conditions.push(sql`${personas.createdAt} >= ${params.fromDate}`);
		if (params.toDate) conditions.push(sql`${personas.createdAt} <= ${params.toDate}`);
		if (params.search) {
			conditions.push(ilike(personas.name, `%${params.search}%`));
		}
		return and(...conditions);
	}
}

export const personaService = new PersonaService();

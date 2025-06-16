import { clientDB } from '@/database/client';
import {
	simulations,
	type SimulationSelect,
	type SimulationInsert,
	SimulationStatus,
} from '@/database/client/schema';
import { eq, inArray, and, ilike, desc, asc, sql } from 'drizzle-orm';
import { personas } from '@/database/client/schema';
import { applications } from '@/database/client/schema';
import { getVisitorId } from '@/store/user';

export interface SimulationQueryParams {
	ids?: number[];
	personaId?: number;
	applicationId?: number;
	taskId?: number;
	status?: SimulationStatus;
	search?: string;
	fromDate?: Date;
	toDate?: Date;
	order?: 'asc' | 'desc';
	limit?: number;
	offset?: number;
}

class SimulationService {
	async togglePin(id: number) {
		const existing = await this.getById(id);
		if (!existing) {
			throw new Error('Simulation not found');
		}
		const updated = await clientDB.transaction(async (tx) => {
			if (existing.pinned === false) {
				await tx.update(simulations).set({ pinned: false }).where(eq(simulations.pinned, true));
			}
			const [updated] = await tx
				.update(simulations)
				.set({ pinned: !existing.pinned })
				.where(eq(simulations.id, id))
				.returning();

			return updated!;
		});
		return updated!;
	}

	async getById(id: number): Promise<SimulationSelect | undefined> {
		const [simulation] = await clientDB
			.select()
			.from(simulations)
			.where(this.prepareFilter({ ids: [id] }))
			.limit(1);
		return simulation;
	}

	async add(data: SimulationInsert): Promise<SimulationSelect> {
		const [inserted] = await clientDB
			.insert(simulations)
			.values({ ...data, fingerprint: getVisitorId() })
			.returning();
		return inserted!;
	}

	async update(id: number, data: Partial<SimulationInsert>): Promise<SimulationSelect> {
		const existing = await this.getById(id);
		if (!existing) {
			throw new Error('Simulation not found');
		}
		const [updated] = await clientDB
			.update(simulations)
			.set({ ...data })
			.where(this.prepareFilter({ ids: [id] }))
			.returning();
		return updated!;
	}

	async remove(id: number): Promise<void> {
		await clientDB.delete(simulations).where(this.prepareFilter({ ids: [id] }));
	}

	async countBy(filter: Partial<SimulationQueryParams> = {}) {
		const whereClause = this.prepareFilter(filter);
		const result = await clientDB
			.select({ count: sql<number>`count(*)` })
			.from(simulations)
			.where(whereClause);
		return result[0]?.count ?? 0;
	}

	async hasMoreThanN(n: number, filter: Partial<SimulationQueryParams> = {}) {
		const whereClause = this.prepareFilter(filter);
		const result = await clientDB
			.select({ id: simulations.id })
			.from(simulations)
			.where(whereClause)
			.limit(n + 1);
		return result.length > n;
	}

	async bulkInsert(list: SimulationInsert[]) {
		const fingerprint = getVisitorId();
		return clientDB
			.insert(simulations)
			.values(list.map((item) => ({ ...item, fingerprint })))
			.returning();
	}

	async bulkDelete(ids: number[]) {
		return clientDB.delete(simulations).where(this.prepareFilter({ ids }));
	}

	async queryBy(params: SimulationQueryParams) {
		const { limit = 20, offset = 0, order = 'desc' } = params;

		const whereClause = this.prepareFilter(params);

		const orderByClause =
			order === 'asc' ? asc(simulations.createdAt) : desc(simulations.createdAt);

		const data = await clientDB
			.select()
			.from(simulations)
			.where(whereClause)
			.orderBy(orderByClause)
			.limit(limit)
			.offset(offset);

		const hasMore = await this.hasMoreThanN(limit + offset, params);

		return {
			hasMore,
			data,
		};
	}

	private prepareFilter(params: Partial<SimulationQueryParams> = {}) {
		const conditions = [];
		conditions.push(eq(simulations.fingerprint, getVisitorId()));
		if (params.ids && params.ids.length > 0) {
			if (params.ids.length === 1) {
				conditions.push(eq(simulations.id, params.ids[0]!));
			} else {
				conditions.push(inArray(simulations.id, params.ids));
			}
		}
		if (params.personaId) conditions.push(eq(simulations.personaId, params.personaId));
		if (params.applicationId) conditions.push(eq(simulations.applicationId, params.applicationId));
		if (params.status) conditions.push(eq(simulations.status, params.status));
		if (params.fromDate) conditions.push(sql`${simulations.createdAt} >= ${params.fromDate}`);
		if (params.toDate) conditions.push(sql`${simulations.createdAt} <= ${params.toDate}`);
		if (params.search) {
			conditions.push(ilike(simulations.fingerprint, `%${params.search}%`));
		}
		return and(...conditions);
	}

	private async buildSimulationInput(simulationId: number) {
		const [result] = await clientDB
			.select({
				simulation: simulations,
				persona: personas,
				application: applications,
			})
			.from(simulations)
			.where(eq(simulations.id, simulationId))
			.innerJoin(personas, eq(simulations.personaId, personas.id))
			.innerJoin(applications, eq(simulations.applicationId, applications.id))
			.limit(1);

		if (!result) throw new Error('Simulation not found');
		const { simulation, persona, application } = result;

		const configuration = {
			browserProfile: {
				extraHTTPHeaders: application.headers ?? undefined,
				storageState: {
					cookies: application.cookies ?? [],
					origins: [],
				},
				httpCredentials: application.credentials ?? undefined,
				timeout: application.timeout ?? 30000,
				env: application.env ?? {},
			},
			prompt: simulation.task,
			useVision: application.useVision,
			wssUrl: application.wssUrl ?? undefined,
			cdpUrl: application.cdpUrl ?? undefined,
			includeAttributes: [],
		};
		return { configuration, state: simulation.state };
	}

	async runStreaming(simulationId: number) {
		const { configuration, state } = await this.buildSimulationInput(simulationId);
		const response = await fetch('/api/simulation', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ configuration, state }),
		});
		if (!response.body) throw new Error('No response body');
		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });
			const events = buffer.split('\n\n');
			buffer = events.pop() || '';
			for (const event of events) {
				if (event.startsWith('event: data')) {
					const dataLine = event.split('\n').find((l) => l.startsWith('data: '));
					if (dataLine) {
						const chunk = JSON.parse(dataLine.replace('data: ', ''));
					}
				}
			}
		}
	}
}

export const simulationService = new SimulationService();

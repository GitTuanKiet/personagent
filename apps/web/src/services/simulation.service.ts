import { clientDB } from '@/database/client';
import {
	simulations,
	personas,
	applications,
	type SimulationSelect,
	type SimulationInsert,
	type SimulationStatus,
	type PersonaSelect,
} from '@/database/client/schema';
import { eq, inArray, and, ilike, desc, asc, sql, getTableColumns } from 'drizzle-orm';
import { getVisitorId } from '@/store/user';

export interface SimulationQueryParams {
	ids?: number[];
	personaId?: number;
	applicationId?: number;
	status?: SimulationStatus;
	search?: string;
	fromDate?: Date;
	toDate?: Date;
	order?: 'asc' | 'desc';
	limit?: number;
	offset?: number;
}

export type SimulationQueryFields = keyof SimulationSelect;

interface SimulationStreamResult {
	status: SimulationStatus;
	state: SimulationSelect['state'];
	error?: unknown;
}

interface SimulationConfiguration {
	browserProfile: {
		extraHTTPHeaders?: Record<string, string>;
		storageState: {
			cookies: any[];
			origins: any[];
		};
		httpCredentials?: any;
		timeout: number;
		env: Record<string, any>;
	};
	prompt: string;
	useVision: boolean;
	sessionId: string;
}

class SimulationService {
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
			.set(data)
			.where(this.prepareFilter({ ids: [id] }))
			.returning();
		return updated!;
	}

	async remove(id: number): Promise<void> {
		await clientDB.delete(simulations).where(this.prepareFilter({ ids: [id] }));
	}

	async countBy(filter: Partial<SimulationQueryParams> = {}): Promise<number> {
		const whereClause = this.prepareFilter(filter);
		const result = await clientDB
			.select({ count: sql<number>`count(*)` })
			.from(simulations)
			.where(whereClause);
		return result[0]?.count ?? 0;
	}

	async queryBy<T extends Array<SimulationQueryFields> | undefined = undefined>(
		params: SimulationQueryParams = {},
		fields?: T,
	): Promise<{
		hasMore: boolean;
		data: T extends undefined
			? SimulationSelect[]
			: Pick<SimulationSelect, NonNullable<T>[number]>[];
	}> {
		const { limit = 20, offset = 0, order = 'desc' } = params;
		const whereClause = this.prepareFilter(params);
		const orderByClause =
			order === 'asc' ? asc(simulations.createdAt) : desc(simulations.createdAt);

		const tableColumns = getTableColumns(simulations);
		const tableColumnsKeys = Object.keys(tableColumns);

		if (fields && fields.length > 0) {
			for (const field of fields) {
				if (!tableColumnsKeys.includes(field)) {
					delete tableColumns[field];
				}
			}
		}

		const data = (await clientDB
			.select(tableColumns)
			.from(simulations)
			.where(whereClause)
			.orderBy(orderByClause)
			.limit(limit)
			.offset(offset)) as T extends undefined
			? SimulationSelect[]
			: Pick<SimulationSelect, NonNullable<T>[number]>[];

		const hasMore = await this.hasMoreThanN(limit + offset, params);

		return { hasMore, data };
	}

	/**
	 * Run an existing simulation by ID
	 */
	async *runSimulation(
		simulationId: number,
		abortSignal?: AbortSignal,
	): AsyncGenerator<SimulationStreamResult> {
		const { configuration, state } = await this.buildSimulationInput(simulationId);
		const decoder = new TextDecoder();

		await this.updateSimulationStatus(simulationId, 'running');

		let result: SimulationStreamResult = {
			status: 'running',
			state: state,
		};
		try {
			const response = await fetch('/api/simulation', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ configuration, state }),
				signal: abortSignal,
			});

			if (!response.body) {
				throw new Error('No response body');
			}

			const reader = response.body.getReader();

			while (true) {
				// Check abort signal
				if (abortSignal?.aborted) {
					await reader.cancel();
					result.status = 'stopped';
					return;
				}

				const { done, value } = await reader.read();
				if (done) break;

				// Parse server-sent events
				const events = decoder.decode(value, { stream: true }).split('\n\n');
				for (const event of events) {
					if (event.startsWith('event: data')) {
						const dataLine = event.split('\n').find((l) => l.startsWith('data: '));
						if (dataLine) {
							try {
								result = {
									status: 'running',
									state: JSON.parse(dataLine.replace('data: ', '')),
								};
								yield result;
							} catch {}
						}
					}
				}
			}

			result = {
				status: 'completed',
				state: result.state,
			};
			yield result;
		} catch (error) {
			// Handle abort vs other errors
			if (abortSignal?.aborted || (error as Error).name === 'AbortError') {
				result.status = 'stopped';
			} else {
				result.status = 'failed';
				result.error = error;
			}

			yield result;
		} finally {
			await this.update(simulationId, { status: result.status, state: result.state });
		}
	}

	// Private helper methods
	private async hasMoreThanN(
		n: number,
		filter: Partial<SimulationQueryParams> = {},
	): Promise<boolean> {
		const whereClause = this.prepareFilter(filter);
		const result = await clientDB
			.select({ id: simulations.id })
			.from(simulations)
			.where(whereClause)
			.limit(n + 1);
		return result.length > n;
	}

	private prepareFilter(params: Partial<SimulationQueryParams> = {}) {
		const conditions = [eq(simulations.fingerprint, getVisitorId())];

		if (params.ids?.length) {
			if (params.ids.length === 1) {
				conditions.push(eq(simulations.id, params.ids[0]!));
			} else {
				conditions.push(inArray(simulations.id, params.ids));
			}
		}

		if (params.personaId) {
			conditions.push(eq(simulations.personaId, params.personaId));
		}

		if (params.applicationId) {
			conditions.push(eq(simulations.applicationId, params.applicationId));
		}

		if (params.status) {
			conditions.push(eq(simulations.status, params.status));
		}

		if (params.fromDate) {
			conditions.push(sql`${simulations.createdAt} >= ${params.fromDate}`);
		}

		if (params.toDate) {
			conditions.push(sql`${simulations.createdAt} <= ${params.toDate}`);
		}

		if (params.search) {
			conditions.push(ilike(simulations.fingerprint, `%${params.search}%`));
		}

		return and(...conditions);
	}

	private async buildSimulationInput(simulationId: number): Promise<{
		configuration: SimulationConfiguration;
		state: any;
	}> {
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

		if (!result) {
			throw new Error(`Simulation with ID ${simulationId} not found`);
		}

		const { simulation, persona, application } = result;

		const configuration: SimulationConfiguration = {
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
			prompt: this.buildPrompt(simulation.task, persona),
			useVision: application.useVision,
			sessionId: `${application.fingerprint}_${application.id}`,
		};

		return { configuration, state: simulation.state };
	}

	private async updateSimulationStatus(
		simulationId: number,
		status: SimulationStatus,
		state?: any,
	): Promise<void> {
		const updateData: Partial<SimulationInsert> = { status };
		if (state !== undefined) {
			updateData.state = state;
		}

		await clientDB.update(simulations).set(updateData).where(eq(simulations.id, simulationId));
	}

	private buildPrompt(task: string, persona: PersonaSelect): string {
		const personaText = `
Name: ${persona.name}
Description: ${persona.description}
Age Group: ${persona.ageGroup}
Digital Skill Level: ${persona.digitalSkillLevel}
Behavior Traits: ${persona.behaviorTraits?.join(', ') ?? 'Unknown'}
Preferences: ${JSON.stringify(persona.preferences ?? {})}
Language: ${persona.language} (this is the language of the persona, you should use this language to reason)
`.trim();

		return `
You are an AI Agent trained to simulate real user behavior to serve the purpose of evaluating user experience (UX). Your goal is to **step into the shoes of a specific user** (persona), read and understand the task to be performed (task), and then **select the appropriate action** using the defined tools.
Think like a real user with the persona described. Based on the current interface and the target headline, come up with the next action that makes the most sense.

## Persona:
${personaText}

## Task:
${task}
`.trim();
	}
}

export const simulationService = new SimulationService();

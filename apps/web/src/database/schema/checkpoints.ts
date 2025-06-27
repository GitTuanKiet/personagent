import {
	pgTable,
	uniqueIndex,
	text,
	timestamp,
	boolean,
	integer,
	uuid,
	jsonb,
	bigint,
	index,
	customType,
	numeric,
	pgSchema,
	serial,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const schemaMigrations = pgTable(
	'schema_migrations',
	{
		version: bigint('version', { mode: 'number' }).primaryKey().notNull(),
		dirty: boolean('dirty').notNull(),
	},
	// (table) => [
	//     uniqueIndex("schema_migrations_pkey").on(table.version),
	// ]
);

export const run = pgTable(
	'run',
	{
		runId: uuid('run_id').defaultRandom().primaryKey().notNull(),
		threadId: uuid('thread_id').notNull(),
		assistantId: uuid('assistant_id').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
		metadata: jsonb('metadata').default(sql`'{}'::jsonb`).notNull(),
		status: text('status').default('pending').notNull(),
		kwargs: jsonb('kwargs').notNull(),
		multitaskStrategy: text('multitask_strategy').default('reject').notNull(),
	},
	(table) => [
		index('run_pending_idx').on(table.createdAt),
		// uniqueIndex("run_pkey").on(table.runId),
		index('run_assistant_id_idx').on(table.assistantId),
		index('run_metadata_idx').on(table.threadId, table.metadata),
		index('run_thread_id_status_idx').on(table.threadId, table.status),
		uniqueIndex('run_running_one_per_thread').on(table.threadId),
		index('run_pending_by_thread_time').on(table.threadId, table.createdAt),
	],
);

export const thread = pgTable(
	'thread',
	{
		threadId: uuid('thread_id').defaultRandom().primaryKey().notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
		metadata: jsonb('metadata').default(sql`'{}'::jsonb`).notNull(),
		status: text('status').default('idle').notNull(),
		config: jsonb('config').default(sql`'{}'::jsonb`).notNull(),
		values: jsonb('values'),
		interrupts: jsonb('interrupts').default(sql`'{}'::jsonb`).notNull(),
		error: customType({ dataType: () => 'bytea' })('error'),
	},
	(table) => [
		// uniqueIndex("thread_pkey").on(table.threadId),
		index('thread_status_idx').on(table.status, table.createdAt),
		index('thread_metadata_idx').on(table.metadata),
		index('thread_values_idx').on(table.values),
		index('thread_created_at_idx').on(table.createdAt),
	],
);

export const checkpoints = pgTable(
	'checkpoints',
	{
		threadId: uuid('thread_id').notNull(),
		checkpointId: uuid('checkpoint_id').notNull(),
		runId: uuid('run_id'),
		parentCheckpointId: uuid('parent_checkpoint_id'),
		checkpoint: jsonb('checkpoint').notNull(),
		metadata: jsonb('metadata').default(sql`'{}'::jsonb`).notNull(),
		checkpointNs: text('checkpoint_ns').default(sql`''::text`).notNull(),
	},
	(table) => [
		index('checkpoints_run_id_idx').on(table.runId),
		index('checkpoints_checkpoint_id_idx').on(table.threadId, table.checkpointId),
		uniqueIndex('checkpoints_pkey').on(table.threadId, table.checkpointNs, table.checkpointId),
	],
);

export const cron = pgTable(
	'cron',
	{
		cronId: uuid('cron_id').defaultRandom().primaryKey().notNull(),
		assistantId: uuid('assistant_id'),
		threadId: uuid('thread_id'),
		userId: text('user_id'),
		payload: jsonb('payload').default(sql`'{}'::jsonb`).notNull(),
		schedule: text('schedule').notNull(),
		nextRunDate: timestamp('next_run_date', { withTimezone: true, mode: 'string' }),
		endTime: timestamp('end_time', { withTimezone: true, mode: 'string' }),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
		metadata: jsonb('metadata').default(sql`'{}'::jsonb`).notNull(),
	},
	// (table) => [
	//     uniqueIndex("cron_pkey").on(table.cronId),
	// ]
);

export const checkpointBlobs = pgTable(
	'checkpoint_blobs',
	{
		threadId: uuid('thread_id').notNull(),
		channel: text('channel').notNull(),
		version: text('version').notNull(),
		type: text('type').notNull(),
		blob: customType({ dataType: () => 'bytea' })('blob'),
		checkpointNs: text('checkpoint_ns').default(sql`''::text`).notNull(),
	},
	(table) => [
		uniqueIndex('checkpoint_blobs_pkey').on(
			table.threadId,
			table.checkpointNs,
			table.channel,
			table.version,
		),
	],
);

export const checkpointWrites = pgTable(
	'checkpoint_writes',
	{
		threadId: uuid('thread_id').notNull(),
		checkpointId: uuid('checkpoint_id').notNull(),
		taskId: uuid('task_id').notNull(),
		idx: integer('idx').notNull(),
		channel: text('channel').notNull(),
		type: text('type').notNull(),
		blob: customType({ dataType: () => 'bytea' })('blob').notNull(),
		checkpointNs: text('checkpoint_ns').default(sql`''::text`).notNull(),
	},
	(table) => [
		uniqueIndex('checkpoint_writes_pkey').on(
			table.threadId,
			table.checkpointNs,
			table.checkpointId,
			table.taskId,
			table.idx,
		),
	],
);

export const store = pgTable(
	'store',
	{
		prefix: text('prefix').notNull(),
		key: text('key').notNull(),
		value: jsonb('value').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
		expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }),
		ttlMinutes: integer('ttl_minutes'),
	},
	(table) => [
		uniqueIndex('store_pkey').on(table.prefix, table.key),
		index('store_prefix_idx').on(table.prefix),
		index('idx_store_expires_at').on(table.expiresAt),
	],
);

export const assistant = pgTable(
	'assistant',
	{
		assistantId: uuid('assistant_id').defaultRandom().primaryKey().notNull(),
		graphId: text('graph_id').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
		config: jsonb('config').default(sql`'{}'::jsonb`).notNull(),
		metadata: jsonb('metadata').default(sql`'{}'::jsonb`).notNull(),
		version: integer('version').default(1).notNull(),
		name: text('name'),
		description: text('description'),
	},
	(table) => [
		uniqueIndex().on(table.assistantId),
		index('assistant_metadata_idx').on(table.metadata),
		index('assistant_graph_id_idx').on(table.graphId, table.createdAt),
		index('assistant_created_at_idx').on(table.createdAt),
	],
);

export const assistantVersions = pgTable(
	'assistant_versions',
	{
		assistantId: uuid('assistant_id').notNull(),
		version: integer('version').default(1).notNull(),
		graphId: text('graph_id').notNull(),
		config: jsonb('config').default(sql`'{}'::jsonb`).notNull(),
		metadata: jsonb('metadata').default(sql`'{}'::jsonb`).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
		name: text('name'),
	},
	(table) => [uniqueIndex('assistant_versions_pkey').on(table.assistantId, table.version)],
);

export const threadTtl = pgTable(
	'thread_ttl',
	{
		threadId: uuid('thread_id').notNull(),
		strategy: text('strategy').default('delete').notNull(),
		ttlMinutes: numeric('ttl_minutes', undefined).notNull(),
		createdAt: timestamp('created_at', { mode: 'string' })
			.default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')`)
			.notNull(),
		expiresAt: timestamp('expires_at', { mode: 'string' }).generatedAlwaysAs(
			sql`(created_at + ((ttl_minutes)::double precision * '00:01:00'::interval))`,
		),
		id: uuid('id').defaultRandom().primaryKey().notNull(),
	},
	(table) => [
		// uniqueIndex("thread_ttl_pkey").on(table.id),
		index('idx_thread_ttl_expires_at').on(table.expiresAt),
		index('idx_thread_ttl_thread_id').on(table.threadId),
		uniqueIndex('idx_thread_ttl_thread_strategy').on(table.threadId, table.strategy),
	],
);

import { wyhash } from '@/lib/wyhash';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

type Journal = {
	version: string;
	dialect: string;
	entries: {
		idx: number;
		version: string;
		when: number;
		tag: string;
		breakpoints: boolean;
	}[];
};

type Migration = {
	sql: string[];
	bps: boolean;
	folderMillis: number;
	hash: string;
};

export async function generateClientMigrations(): Promise<Migration[]> {
	let journal: Journal;
	try {
		journal = (await import('../src/database/client/migrations/meta/_journal.json'))
			.default as Journal;
	} catch (error) {
		throw new Error(`Migration file not found. Please run \`pnpm run db:generate\`.`);
	}

	const migrations: Migration[] = [];
	for (const entry of journal.entries) {
		const sqlFile = await readFile(
			resolve(__dirname, `../src/database/client/migrations/${entry.tag}.sql`),
			'utf-8',
		);
		migrations.push({
			sql: sqlFile.split('--> statement-breakpoint'),
			bps: entry.breakpoints,
			folderMillis: entry.when,
			hash: wyhash(sqlFile).toString(16),
		});
	}
	await writeFile(
		resolve(__dirname, '../src/database/client/migrations.json'),
		JSON.stringify(migrations, null, 2),
	);

	return migrations;
}

await generateClientMigrations();

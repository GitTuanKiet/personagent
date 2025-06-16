import { defineConfig } from 'drizzle-kit';

const isClient = process.env.IN_CLIENT === 'true';
const url = isClient ? process.env.DATABASE_URL : process.env.SERVER_DATABASE_URL;
if (!url) {
	throw new Error(`In ${isClient ? 'client' : 'server'} mode, missing database URL`);
}

export default defineConfig({
	schema: isClient ? './src/database/client/schema.ts' : './src/database/server/schema.ts',
	out: isClient ? './src/database/client/migrations' : './src/database/server/migrations',
	dialect: 'postgresql',
	...(isClient ? { driver: 'pglite' } : {}),
	dbCredentials: {
		url,
	},
	strict: true,
});

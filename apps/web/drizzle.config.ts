import { defineConfig } from 'drizzle-kit';

const url = process.env.DATABASE_URI;
if (!url) {
	throw new Error(`Missing database URL, 'DATABASE_URI' is not set correctly`);
}

export default defineConfig({
	schema: './src/database/schema',
	out: './src/database/migrations',
	dialect: 'postgresql',
	dbCredentials: {
		url,
	},
	strict: true,
});

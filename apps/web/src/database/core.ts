import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const getDBInstance = () => {
	const connectionString = process.env.DATABASE_URI;

	if (!connectionString) {
		throw new Error(`You are try to use database, but "DATABASE_URI" is not set correctly`);
	}

	return drizzle(connectionString, { schema });
};

export const serverDB = getDBInstance();

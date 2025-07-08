import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/hooks/utils';
import { createNamespace, USER_APPLICATION_STORE_KEY } from '@/lib/store';
import { CreateApplicationData } from '@/components/application-select/create-edit-application/constants';

export interface Application {
	id: string;
	name: string;
	url: string;
	headers?: Record<string, string>;
	cookies?: string;
}

const client = createClient();

const getNamespace = (userId?: string) => createNamespace(userId ?? 'visitor');

export async function fetchApplications(userId?: string): Promise<Application[]> {
	const item = await client.store.getItem(getNamespace(userId), USER_APPLICATION_STORE_KEY);
	if (item?.value) return Object.values(item.value) as Application[];
	return [];
}

export async function storeApplication(
	data: CreateApplicationData,
	userId?: string,
): Promise<Application> {
	const current = await fetchApplications(userId);
	const id = uuidv4();
	const newApp: Application = { id, ...(data as any) } as Application;
	const obj = { ...Object.fromEntries(current.map((a) => [a.id, a])), [id]: newApp };
	await client.store.putItem(getNamespace(userId), USER_APPLICATION_STORE_KEY, obj);
	return newApp;
}

export async function updateApplication(
	id: string,
	data: CreateApplicationData,
	userId?: string,
): Promise<Application | undefined> {
	const current = await fetchApplications(userId);
	if (!current.find((a) => a.id === id)) return undefined;
	const updated: Application = { id, ...(data as any) } as Application;
	const obj = { ...Object.fromEntries(current.map((a) => [a.id, a])), [id]: updated };
	await client.store.putItem(getNamespace(userId), USER_APPLICATION_STORE_KEY, obj);
	return updated;
}

export async function deleteApplication(id: string, userId?: string): Promise<boolean> {
	const current = await fetchApplications(userId);
	if (!current.find((a) => a.id === id)) return false;
	const obj = Object.fromEntries(current.filter((a) => a.id !== id).map((a) => [a.id, a]));
	await client.store.putItem(getNamespace(userId), USER_APPLICATION_STORE_KEY, obj);
	return true;
}

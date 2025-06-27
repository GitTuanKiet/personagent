import { NextRequest } from 'next/server';
import { handleGetApplications, handleCreateApplication } from './handle';

export const revalidate = 0;

export async function GET(request: NextRequest) {
	return handleGetApplications(request);
}

export async function POST(request: NextRequest) {
	return handleCreateApplication(request);
}

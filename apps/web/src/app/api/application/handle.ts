import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { queries } from './queries';
import type { CreateApplicationData, UpdateApplicationData } from '@/types';

async function withAuth<T>(
	request: NextRequest,
	handler: (userId: string) => Promise<T>,
): Promise<NextResponse | T> {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		return await handler(session.user.id);
	} catch (error) {
		console.error('Auth error:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function getUserApplications(userId: string) {
	const prepared = queries.getUserApplications();
	return await prepared.execute({ userId });
}

export async function getApplicationById(id: string, userId: string) {
	const prepared = queries.getApplicationById();
	const [app] = await prepared.execute({ id, userId });
	return app || null;
}

export async function createApplication(userId: string, data: CreateApplicationData) {
	return await queries.insertApplication(userId, data);
}

export async function updateApplication(id: string, userId: string, data: UpdateApplicationData) {
	const ownershipPrepared = queries.checkApplicationOwnership();
	const [exists] = await ownershipPrepared.execute({ id, userId });

	if (!exists) {
		return null;
	}

	return await queries.updateApplication(id, userId, data);
}

export async function deleteApplication(id: string, userId: string) {
	const ownershipPrepared = queries.checkApplicationOwnership();
	const [exists] = await ownershipPrepared.execute({ id, userId });

	if (!exists) {
		return null;
	}

	return await queries.deleteApplication(id, userId);
}

export async function handleGetApplications(request: NextRequest) {
	return withAuth(request, async (userId) => {
		const applications = await getUserApplications(userId);
		return NextResponse.json(applications);
	});
}

export async function handleGetApplicationById(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	return withAuth(request, async (userId) => {
		const { id } = params;
		const app = await getApplicationById(id, userId);

		if (!app) {
			return NextResponse.json({ error: 'Application not found' }, { status: 404 });
		}

		return NextResponse.json(app);
	});
}

export async function handleCreateApplication(request: NextRequest) {
	return withAuth(request, async (userId) => {
		try {
			const body = await request.json();
			const newApplication = await createApplication(userId, body);
			return NextResponse.json(newApplication, { status: 201 });
		} catch (error) {
			console.error('Error creating application:', error);
			return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
		}
	});
}

export async function handleUpdateApplication(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	return withAuth(request, async (userId) => {
		try {
			const { id } = params;
			const body = await request.json();
			const updatedApplication = await updateApplication(id, userId, body);

			if (!updatedApplication) {
				return NextResponse.json({ error: 'Application not found' }, { status: 404 });
			}

			return NextResponse.json(updatedApplication);
		} catch (error) {
			console.error('Error updating application:', error);
			return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
		}
	});
}

export async function handleDeleteApplication(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	return withAuth(request, async (userId) => {
		const { id } = params;
		const deletedApplication = await deleteApplication(id, userId);

		if (!deletedApplication) {
			return NextResponse.json({ error: 'Application not found' }, { status: 404 });
		}

		return NextResponse.json({
			message: 'Application deleted successfully',
			application: deletedApplication,
		});
	});
}

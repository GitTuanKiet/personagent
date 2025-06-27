import { NextRequest } from 'next/server';
import {
	handleGetApplicationById,
	handleUpdateApplication,
	handleDeleteApplication,
} from '../handle';

export const revalidate = 0;

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
	return handleGetApplicationById(request, { params });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
	return handleUpdateApplication(request, { params });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
	return handleDeleteApplication(request, { params });
}

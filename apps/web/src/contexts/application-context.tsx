import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import {
	Application,
	fetchApplications,
	storeApplication,
	updateApplication as updateAppApi,
	deleteApplication as deleteAppApi,
} from '@/lib/appApi';
import { CreateApplicationData } from '@/components/application-select/create-edit-application/constants';

interface ApplicationContentType {
	selectedApplication: Application | null;
	setSelectedApplication: (app: Application | null) => void;
	applications: Application[];
	loading: boolean;
	refresh: () => Promise<void>;
	createApplication: (data: CreateApplicationData) => Promise<Application | undefined>;
	updateApplication: (id: string, data: CreateApplicationData) => Promise<Application | undefined>;
	deleteApplication: (id: string) => Promise<boolean>;
}

const ApplicationContext = createContext<ApplicationContentType | undefined>(undefined);

export function ApplicationProvider({
	children,
	visitorId,
}: {
	children: ReactNode;
	visitorId: string;
}) {
	const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
	const [applications, setApplications] = useState<Application[]>([]);
	const [loading, setLoading] = useState(false);

	const refresh = async () => {
		setLoading(true);
		const apps = await fetchApplications(visitorId);
		setApplications(apps);
		setLoading(false);
	};

	useEffect(() => {
		refresh();
	}, [visitorId]);

	const createApplication = async (data: CreateApplicationData) => {
		setLoading(true);
		const app = await storeApplication(data, visitorId);
		setApplications((prev) => [...prev, app]);
		setLoading(false);
		return app;
	};

	const updateApplication = async (id: string, data: CreateApplicationData) => {
		setLoading(true);
		const updated = await updateAppApi(id, data, visitorId);
		if (updated) {
			setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
		}
		setLoading(false);
		return updated;
	};

	const deleteApplication = async (id: string) => {
		setLoading(true);
		const success = await deleteAppApi(id, visitorId);
		if (success) {
			setApplications((prev) => prev.filter((a) => a.id !== id));
			if (selectedApplication?.id === id) setSelectedApplication(null);
		}
		setLoading(false);
		return success;
	};

	return (
		<ApplicationContext.Provider
			value={{
				selectedApplication,
				setSelectedApplication,
				applications,
				loading,
				refresh,
				createApplication,
				updateApplication,
				deleteApplication,
			}}
		>
			{children}
		</ApplicationContext.Provider>
	);
}

export function useApplicationContext() {
	const ctx = useContext(ApplicationContext);
	if (!ctx) throw new Error('useApplicationContext must be within ApplicationProvider');
	return ctx;
}

import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState } from 'react';
import { useUserContext } from '@/contexts/user-context';
import { applicationService } from '@/services/application.service';
import { toast } from 'sonner';
import { Application } from '@/types';

type ApplicationContentType = {
	applications: Application[];
	selectedApplication: Application | undefined;
	isLoadingAllApplications: boolean;
	isDeletingApplication: boolean;
	isCreatingApplication: boolean;
	isEditingApplication: boolean;
	getOrCreateApplication: () => Promise<void>;
	getApplications: () => Promise<void>;
	deleteApplication: (applicationId: string) => Promise<boolean>;
	createCustomApplication: (args: CreateCustomApplicationArgs) => Promise<Application | undefined>;
	editCustomApplication: (args: EditCustomApplicationArgs) => Promise<Application | undefined>;
	setSelectedApplication: Dispatch<SetStateAction<Application | undefined>>;
};

export interface CreateApplicationFields extends Partial<Application> {}

export type CreateCustomApplicationArgs = {
	newApplication: CreateApplicationFields;
	successCallback?: (id: string) => void;
};

export type EditCustomApplicationArgs = {
	editedApplication: CreateApplicationFields;
	applicationId: string;
};

const AppContext = createContext<ApplicationContentType | undefined>(undefined);

export function ApplicationProvider({ children }: { children: ReactNode }) {
	const { session } = useUserContext();
	const [isLoadingAllApplications, setIsLoadingAllApplications] = useState(false);
	const [isDeletingApplication, setIsDeletingApplication] = useState(false);
	const [isCreatingApplication, setIsCreatingApplication] = useState(false);
	const [isEditingApplication, setIsEditingApplication] = useState(false);
	const [applications, setApplications] = useState<Application[]>([]);
	const [selectedApplication, setSelectedApplication] = useState<Application>();

	const getApplications = async (): Promise<void> => {
		setIsLoadingAllApplications(true);
		try {
			const response = await applicationService.getAllApplications(session?.token);

			if (response.error) {
				toast.error('Failed to get applications', {
					description: response.error,
				});
				console.error('Failed to get applications', response.error);
				return;
			}

			setApplications(response.data || []);
		} catch (e) {
			toast.error('Failed to get applications', {
				description: 'Please try again later.',
			});
			console.error('Failed to get applications', e);
		} finally {
			setIsLoadingAllApplications(false);
		}
	};

	const deleteApplication = async (applicationId: string): Promise<boolean> => {
		setIsDeletingApplication(true);
		try {
			const response = await applicationService.deleteApplication(applicationId, session?.token);

			if (response.error) {
				toast.error('Failed to delete application', {
					description: response.error,
				});
				console.error('Failed to delete application', response.error);
				setIsDeletingApplication(false);
				return false;
			}

			if (selectedApplication?.id.toString() === applicationId) {
				const defaultApplication = applications.find((a) => a.isActive) || applications[0];
				setSelectedApplication(defaultApplication);
			}

			setApplications((prev) =>
				prev.filter((application) => application.id.toString() !== applicationId),
			);

			toast.success('Application deleted successfully');
			setIsDeletingApplication(false);
			return true;
		} catch (e) {
			toast.error('Failed to delete application', {
				description: 'Please try again later.',
			});
			console.error('Failed to delete application', e);
			setIsDeletingApplication(false);
			return false;
		}
	};

	const createCustomApplication = async ({
		newApplication,
		successCallback,
	}: CreateCustomApplicationArgs): Promise<Application | undefined> => {
		setIsCreatingApplication(true);
		try {
			const response = await applicationService.createApplication(
				{
					name: newApplication.name || 'Untitled Application',
					description: newApplication.description,
					iconData: newApplication.iconData,
					useVision: newApplication.useVision ?? false,
					recursionLimit: newApplication.recursionLimit ?? 100,
					browserProfile: newApplication.browserProfile,
					isActive: newApplication.isActive ?? true,
				},
				session?.token,
			);

			if (response.error) {
				toast.error('Failed to create application', {
					description: response.error,
				});
				console.error('Failed to create application', response.error);
				setIsCreatingApplication(false);
				return undefined;
			}

			const createdApplication = response.data!;
			setApplications((prev) => [...prev, createdApplication]);
			setSelectedApplication(createdApplication);
			successCallback?.(createdApplication.id.toString());

			toast.success('Application created successfully');
			setIsCreatingApplication(false);
			return createdApplication;
		} catch (e) {
			toast.error('Failed to create application', {
				description: 'Please try again later.',
			});
			setIsCreatingApplication(false);
			console.error('Failed to create an application', e);
			return undefined;
		}
	};

	const editCustomApplication = async ({
		editedApplication,
		applicationId,
	}: EditCustomApplicationArgs): Promise<Application | undefined> => {
		setIsEditingApplication(true);
		try {
			const updateData: any = {};

			// Only include defined fields
			if (editedApplication.name !== undefined) updateData.name = editedApplication.name;
			if (editedApplication.description !== undefined)
				updateData.description = editedApplication.description;
			if (editedApplication.iconData !== undefined)
				updateData.iconData = editedApplication.iconData;
			if (editedApplication.useVision !== undefined)
				updateData.useVision = editedApplication.useVision;
			if (editedApplication.recursionLimit !== undefined)
				updateData.recursionLimit = editedApplication.recursionLimit;
			if (editedApplication.browserProfile !== undefined)
				updateData.browserProfile = editedApplication.browserProfile;
			if (editedApplication.isActive !== undefined)
				updateData.isActive = editedApplication.isActive;

			const response = await applicationService.updateApplication(
				applicationId,
				updateData,
				session?.token,
			);

			if (response.error) {
				toast.error('Failed to update application', {
					description: response.error,
				});
				console.error('Failed to edit application', response.error);
				setIsEditingApplication(false);
				return undefined;
			}

			const updatedApplication = response.data!;
			setApplications((prev) =>
				prev.map((application) => {
					if (application.id.toString() === applicationId) {
						return updatedApplication;
					}
					return application;
				}),
			);

			toast.success('Application updated successfully');
			setIsEditingApplication(false);
			return updatedApplication;
		} catch (e) {
			toast.error('Failed to update application', {
				description: 'Please try again later.',
			});
			console.error('Failed to edit application', e);
			setIsEditingApplication(false);
			return undefined;
		}
	};

	const getOrCreateApplication = async () => {
		if (selectedApplication) {
			return;
		}
		setIsLoadingAllApplications(true);

		try {
			// Get all applications from API
			const response = await applicationService.getAllApplications(session?.token);

			let userApplications: Application[] = [];

			if (response.error) {
				console.error('Failed to get applications', response.error);
				userApplications = [];
			} else {
				userApplications = response.data || [];
			}

			// If no applications exist, create a default one
			if (!userApplications.length) {
				const defaultApp: CreateApplicationFields = {
					name: 'Default Application',
					description: 'Default application for testing',
					recursionLimit: 100,
					useVision: false,
					browserProfile: {
						blockedDomains: [],
						allowedDomains: [],
						extraHTTPHeaders: {},
					},
					isActive: true,
				};

				await createCustomApplication({
					newApplication: defaultApp,
				});

				setIsLoadingAllApplications(false);
				return;
			}

			setApplications(userApplications);

			// Find active application or use first one
			const defaultApplication = userApplications.find((application) => application.isActive);

			if (!defaultApplication) {
				const firstApplication = userApplications.sort((a, b) => {
					return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
				})[0];

				const updatedApplication = await editCustomApplication({
					editedApplication: {
						...firstApplication,
						isActive: true,
					},
					applicationId: firstApplication.id.toString(),
				});

				setSelectedApplication(updatedApplication);
			} else {
				setSelectedApplication(defaultApplication);
			}
		} catch (e) {
			console.error('Failed to get or create application', e);
		} finally {
			setIsLoadingAllApplications(false);
		}
	};

	const contextValue: ApplicationContentType = {
		applications,
		selectedApplication,
		isLoadingAllApplications,
		isDeletingApplication,
		isCreatingApplication,
		isEditingApplication,
		getOrCreateApplication,
		getApplications,
		deleteApplication,
		createCustomApplication,
		editCustomApplication,
		setSelectedApplication,
	};

	return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export function useApplicationContext() {
	const context = useContext(AppContext);
	if (context === undefined) {
		throw new Error('useApplicationContext must be used within an ApplicationProvider');
	}
	return context;
}

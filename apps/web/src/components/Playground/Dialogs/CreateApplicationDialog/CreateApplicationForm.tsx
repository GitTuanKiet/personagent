'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Button } from '@workspace/ui/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@workspace/ui/components/dialog';
import { Form } from '@workspace/ui/components/form';
import { toast } from 'sonner';
import { usePlaygroundStore } from '@/store/playground';
import { useCreateApplicationDialog, useEditApplicationDialog } from '@/store/user/selectors';
import { BasicInfoTab } from './BasicInfoTab';
import { DomainsTab } from './DomainsTab';
import { ConfigurationTab } from './ConfigurationTab';
import { HeadersTab } from './HeadersTab';
import { EnvironmentTab } from './EnvironmentTab';
import { DEFAULT_FORM_DATA } from './constants';
import { applicationFormSchema } from './schema';
import type { ApplicationFormData } from './types';
import type { ApplicationSelect } from '@/database/client/schema';
import { TrashIcon } from 'lucide-react';

function applicationToFormData(
	application: ApplicationSelect | ApplicationFormData,
): ApplicationFormData {
	return {
		name: application.name,
		description: application.description || '',
		allowedDomains: application.allowedDomains || [],
		headers: application.headers || {},
		timeout: application.timeout,
		recursionLimit: application.recursionLimit,
		useVision: application.useVision,
		env: application.env || {},
		wssUrl: application.wssUrl || '',
		cdpUrl: application.cdpUrl || '',
		pinned: application.pinned,
	};
}

interface CreateApplicationFormProps {
	initialData?: ApplicationFormData | ApplicationSelect;
	isEditMode?: boolean;
	applicationId?: number;
}

export function CreateApplicationForm({
	initialData,
	isEditMode = false,
	applicationId,
}: CreateApplicationFormProps) {
	const { isOpen: isCreateOpen, closeDialog: closeCreateDialog } = useCreateApplicationDialog();
	const { isOpen: isEditOpen, closeDialog: closeEditDialog } = useEditApplicationDialog();
	const {
		editingApplication,
		createApplication,
		updateApplication,
		deleteApplication,
		setEditingApplication,
		applicationNameExists,
	} = usePlaygroundStore();

	const form = useForm<ApplicationFormData>({
		resolver: zodResolver(applicationFormSchema),
		defaultValues: initialData ? applicationToFormData(initialData) : DEFAULT_FORM_DATA,
	});

	const {
		handleSubmit,
		formState: { isSubmitting },
		reset,
		watch,
	} = form;
	const [isDeleting, setIsDeleting] = useState(false);

	const isOpen = isEditMode ? isEditOpen : isCreateOpen;
	const closeDialog = isEditMode ? closeEditDialog : closeCreateDialog;

	// Update form when initialData changes
	useEffect(() => {
		if (initialData) {
			reset(applicationToFormData(initialData));
		}
	}, [initialData, reset]);

	const onSubmit = async (data: ApplicationFormData) => {
		if (!isEditMode || (isEditMode && data.name !== editingApplication?.name)) {
			if (await applicationNameExists(data.name)) {
				toast.error('Application with this name already exists');
				return;
			}
		}

		try {
			const submitData = {
				name: data.name.trim(),
				description: data.description.trim() || null,
				allowedDomains: data.allowedDomains,
				headers: Object.keys(data.headers).length > 0 ? data.headers : null,
				cookies: null,
				credentials: null,
				timeout: data.timeout,
				env: Object.keys(data.env).length > 0 ? data.env : null,
				wssUrl: data.wssUrl.trim() || null,
				cdpUrl: data.cdpUrl.trim() || null,
				recursionLimit: data.recursionLimit,
				useVision: data.useVision,
				pinned: data.pinned,
			};

			if (isEditMode && applicationId) {
				await updateApplication(applicationId, submitData);
				toast.success('Application updated successfully!');
			} else {
				await createApplication(submitData);
				toast.success('Application created successfully!');
			}

			reset(DEFAULT_FORM_DATA);
			closeDialog();

			if (isEditMode) {
				setEditingApplication(null);
			}
		} catch (error) {
			toast.error(isEditMode ? 'Failed to update application' : 'Failed to create application');
			console.error('Failed to submit application:', error);
		}
	};

	const handleDelete = async () => {
		if (!isEditMode || !applicationId) return;

		if (
			!confirm('Are you sure you want to delete this application? This action cannot be undone.')
		) {
			return;
		}

		setIsDeleting(true);
		try {
			await deleteApplication(applicationId);
			toast.success('Application deleted successfully!');
			handleClose();
		} catch (error) {
			toast.error('Failed to delete application');
			console.error('Failed to delete application:', error);
		} finally {
			setIsDeleting(false);
		}
	};

	const handleClose = () => {
		reset(DEFAULT_FORM_DATA);
		closeDialog();
		if (isEditMode) {
			setEditingApplication(null);
		}
	};

	const formName = watch('name');
	const isFormValid = formName?.trim().length > 0;

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-4xl">
				<DialogHeader>
					<DialogTitle>
						{isEditMode ? `Edit Application: ${formName}` : 'Create New Application'}
					</DialogTitle>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
						<Tabs defaultValue="basic" className="w-full">
							<TabsList className="grid w-full grid-cols-5">
								<TabsTrigger value="basic">Basic Info</TabsTrigger>
								<TabsTrigger value="domains">Domains</TabsTrigger>
								<TabsTrigger value="configuration">Configuration</TabsTrigger>
								<TabsTrigger value="headers">Headers</TabsTrigger>
								<TabsTrigger value="environment">Environment</TabsTrigger>
							</TabsList>

							<div className="mt-6">
								<TabsContent value="basic" className="space-y-4">
									<BasicInfoTab />
								</TabsContent>

								<TabsContent value="domains" className="space-y-4">
									<DomainsTab />
								</TabsContent>

								<TabsContent value="configuration" className="space-y-4">
									<ConfigurationTab />
								</TabsContent>

								<TabsContent value="headers" className="space-y-4">
									<HeadersTab />
								</TabsContent>

								<TabsContent value="environment" className="space-y-4">
									<EnvironmentTab />
								</TabsContent>
							</div>
						</Tabs>

						<div className="flex gap-2 pt-4 border-t justify-between">
							{isEditMode ? (
								<Button
									type="button"
									variant="destructive"
									onClick={handleDelete}
									disabled={isDeleting || isSubmitting}
									className="flex-shrink-0"
								>
									<TrashIcon size={16} className="mr-2" />
									{isDeleting ? 'Deleting...' : 'Delete'}
								</Button>
							) : (
								<div className="flex-1" />
							)}
							<div className="flex gap-2 justify-end">
								<Button type="button" variant="outline" onClick={handleClose} className="flex-1">
									Cancel
								</Button>
								<Button type="submit" disabled={!isFormValid || isSubmitting} className="flex-1">
									{isSubmitting
										? isEditMode
											? 'Updating...'
											: 'Creating...'
										: isEditMode
											? 'Update Application'
											: 'Create Application'}
								</Button>
							</div>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

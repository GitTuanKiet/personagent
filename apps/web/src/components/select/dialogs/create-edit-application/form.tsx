'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@workspace/ui/components/form';
import { Button } from '@workspace/ui/components/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { toast } from 'sonner';
import { AppWindow, Settings, Globe, Code } from 'lucide-react';
import { BasicInfoTab, ConfigurationTab, DomainsTab, HeadersTab } from './tabs';
import { type CreateApplicationData, createApplicationSchema } from '@/types';
import type { Application } from '@/types';

const DEFAULT_FORM_DATA: CreateApplicationData = {
	name: '',
	description: '',
	iconData: {
		iconName: 'AppWindow',
		iconColor: '#3b82f6',
	},
	useVision: false,
	recursionLimit: 50,
	browserProfile: {
		blockedDomains: [],
		allowedDomains: [],
		extraHTTPHeaders: {},
	},
	isActive: true,
};

export interface ApplicationFormProps {
	userId?: string;
	isEditing: boolean;
	application?: Application;
	onSubmit: (data: CreateApplicationData) => Promise<boolean>;
	onCancel: () => void;
	isLoading?: boolean;
	disabled?: boolean;
}

export function ApplicationForm({
	userId,
	isEditing,
	application,
	onSubmit,
	onCancel,
	isLoading = false,
	disabled = false,
}: ApplicationFormProps) {
	const [activeTab, setActiveTab] = useState('basic');

	const getDefaultValues = (): CreateApplicationData => {
		if (application && isEditing) {
			return application;
		}
		return DEFAULT_FORM_DATA;
	};

	const form = useForm<CreateApplicationData>({
		resolver: zodResolver(createApplicationSchema),
		defaultValues: getDefaultValues(),
	});

	const {
		handleSubmit,
		formState: { isSubmitting },
	} = form;

	const handleFormSubmit = async (data: CreateApplicationData) => {
		if (!userId) {
			toast.error('User not found');
			return;
		}
		if (isEditing && !application) {
			toast.error('Application not found');
			return;
		}

		try {
			const success = await onSubmit(data);
			if (success) {
				toast.success(`Application ${isEditing ? 'updated' : 'created'} successfully`);
			} else {
				toast.error(`Failed to ${isEditing ? 'update' : 'create'} application`);
			}
		} catch (error) {
			console.error('Failed to submit application:', error);
			toast.error(`Failed to ${isEditing ? 'update' : 'create'} application`);
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList className="grid w-full grid-cols-4">
						<TabsTrigger value="basic" className="flex items-center gap-2">
							<AppWindow className="w-4 h-4" />
							Basic
						</TabsTrigger>
						<TabsTrigger value="config" className="flex items-center gap-2">
							<Settings className="w-4 h-4" />
							Config
						</TabsTrigger>
						<TabsTrigger value="domains" className="flex items-center gap-2">
							<Globe className="w-4 h-4" />
							Domains
						</TabsTrigger>
						<TabsTrigger value="headers" className="flex items-center gap-2">
							<Code className="w-4 h-4" />
							Headers
						</TabsTrigger>
					</TabsList>

					<TabsContent value="basic" className="space-y-4">
						<BasicInfoTab allDisabled={disabled || isLoading} />
					</TabsContent>

					<TabsContent value="config" className="space-y-4">
						<ConfigurationTab allDisabled={disabled || isLoading} />
					</TabsContent>

					<TabsContent value="domains" className="space-y-4">
						<DomainsTab allDisabled={disabled || isLoading} />
					</TabsContent>

					<TabsContent value="headers" className="space-y-4">
						<HeadersTab allDisabled={disabled || isLoading} />
					</TabsContent>
				</Tabs>

				<div className="flex justify-end gap-3 pt-4 border-t">
					<Button
						type="button"
						variant="outline"
						onClick={onCancel}
						disabled={isSubmitting || disabled || isLoading}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={isSubmitting || disabled || isLoading}>
						{isSubmitting || isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
					</Button>
				</div>
			</form>
		</Form>
	);
}

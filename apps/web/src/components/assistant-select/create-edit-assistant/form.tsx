import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@workspace/ui/components/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Form } from '@workspace/ui/components/form';
import { UserIcon, TargetIcon, BrainIcon, SettingsIcon, PaletteIcon } from 'lucide-react';
import { toast } from 'sonner';
import { TighterText } from '@/components/ui/tighter-text';
import {
	BasicInfoTab,
	DemographicsTab,
	BehaviorTraitsTab,
	PreferencesTab,
	AppearanceTab,
} from './tabs';
import { createAssistantSchema, type CreatePersonaData } from '@/types';
import { DEFAULT_ASSISTANT_DATA } from './constants';

export interface PersonaFormProps {
	isEditing: boolean;
	initialData?: CreatePersonaData;
	onSubmit: (data: CreatePersonaData) => Promise<void>;
	onCancel: () => void;
	disabled?: boolean;
}

export function PersonaForm({
	isEditing,
	initialData,
	onSubmit,
	onCancel,
	disabled = false,
}: PersonaFormProps) {
	const [activeTab, setActiveTab] = useState('basic');

	const form = useForm<CreatePersonaData>({
		resolver: zodResolver(createAssistantSchema),
		defaultValues: initialData ?? DEFAULT_ASSISTANT_DATA,
	});

	const {
		handleSubmit,
		formState: { isSubmitting },
		reset,
	} = form;

	useEffect(() => {
		reset(initialData ?? DEFAULT_ASSISTANT_DATA);
	}, [initialData, isEditing, reset]);

	const onFormSubmit = async (data: CreatePersonaData) => {
		try {
			await onSubmit(data);
		} catch (error) {
			console.error('Failed to submit assistant:', error);
			toast.error(isEditing ? 'Failed to update assistant' : 'Failed to create assistant');
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<TabsList className="grid w-full grid-cols-5">
						<TabsTrigger value="basic" className="flex items-center gap-2">
							<UserIcon className="h-4 w-4" />
							<TighterText>Basic</TighterText>
						</TabsTrigger>
						<TabsTrigger value="appearance" className="flex items-center gap-2">
							<PaletteIcon className="h-4 w-4" />
							<TighterText>Appearance</TighterText>
						</TabsTrigger>
						<TabsTrigger value="demographics" className="flex items-center gap-2">
							<TargetIcon className="h-4 w-4" />
							<TighterText>Demographics</TighterText>
						</TabsTrigger>
						<TabsTrigger value="behavior" className="flex items-center gap-2">
							<BrainIcon className="h-4 w-4" />
							<TighterText>Behavior</TighterText>
						</TabsTrigger>
						<TabsTrigger value="preferences" className="flex items-center gap-2">
							<SettingsIcon className="h-4 w-4" />
							<TighterText>Preferences</TighterText>
						</TabsTrigger>
					</TabsList>

					<TabsContent value="basic" className="space-y-4">
						<BasicInfoTab allDisabled={disabled} />
					</TabsContent>

					<TabsContent value="appearance" className="space-y-4">
						<AppearanceTab allDisabled={disabled} />
					</TabsContent>

					<TabsContent value="demographics" className="space-y-4">
						<DemographicsTab allDisabled={disabled} />
					</TabsContent>

					<TabsContent value="behavior" className="space-y-4">
						<BehaviorTraitsTab allDisabled={disabled} />
					</TabsContent>

					<TabsContent value="preferences" className="space-y-4">
						<PreferencesTab allDisabled={disabled} />
					</TabsContent>
				</Tabs>

				<div className="flex gap-2 justify-end pt-4 border-t">
					<Button type="button" variant="outline" onClick={onCancel} disabled={disabled}>
						<TighterText>Cancel</TighterText>
					</Button>
					<Button type="submit" disabled={disabled || isSubmitting}>
						<TighterText>
							{isSubmitting
								? isEditing
									? 'Updating...'
									: 'Creating...'
								: isEditing
									? 'Update Assistant'
									: 'Create Assistant'}
						</TighterText>
					</Button>
				</div>
			</form>
		</Form>
	);
}

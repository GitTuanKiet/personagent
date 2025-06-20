import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@workspace/ui/components/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Form } from '@workspace/ui/components/form';
import { UserIcon, TargetIcon, BrainIcon, SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';
import { BasicInfoTab } from './BasicInfoTab';
import { DemographicsTab } from './DemographicsTab';
import { BehaviorTraitsTab } from './BehaviorTraitsTab';
import { PreferencesTab } from './PreferencesTab';
import { personaFormSchema } from './schema';
import { DEFAULT_PERSONA_DATA } from './constants';
import { CreatePersonaFormProps, PersonaFormData } from './types';

export function CreatePersonaForm({
	initialData,
	onClose,
	onSubmit,
	isEditMode = false,
}: CreatePersonaFormProps) {
	const [activeTab, setActiveTab] = useState('basic');

	const form = useForm<PersonaFormData>({
		resolver: zodResolver(personaFormSchema),
		defaultValues: initialData || DEFAULT_PERSONA_DATA,
	});

	const {
		handleSubmit,
		formState: { isSubmitting },
	} = form;

	const onFormSubmit = async (data: PersonaFormData) => {
		try {
			const submitData = {
				name: data.name,
				description: data.description || null,
				ageGroup: data.ageGroup || null,
				digitalSkillLevel: data.digitalSkillLevel || null,
				behaviorTraits: data.behaviorTraits.length > 0 ? data.behaviorTraits : null,
				preferences: Object.keys(data.preferences).length > 0 ? data.preferences : null,
				pinned: data.pinned,
				language: data.language,
			};

			await onSubmit(submitData);
		} catch (error) {
			console.error('Failed to submit persona:', error);
			toast.error(isEditMode ? 'Failed to update persona' : 'Failed to create persona');
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<TabsList className="grid w-full grid-cols-4">
						<TabsTrigger value="basic" className="flex items-center gap-2">
							<UserIcon className="h-4 w-4" />
							Basic
						</TabsTrigger>
						<TabsTrigger value="demographics" className="flex items-center gap-2">
							<TargetIcon className="h-4 w-4" />
							Demographics
						</TabsTrigger>
						<TabsTrigger value="behavior" className="flex items-center gap-2">
							<BrainIcon className="h-4 w-4" />
							Behavior
						</TabsTrigger>
						<TabsTrigger value="preferences" className="flex items-center gap-2">
							<SettingsIcon className="h-4 w-4" />
							Preferences
						</TabsTrigger>
					</TabsList>

					<TabsContent value="basic" className="space-y-4">
						<BasicInfoTab />
					</TabsContent>

					<TabsContent value="demographics" className="space-y-4">
						<DemographicsTab />
					</TabsContent>

					<TabsContent value="behavior" className="space-y-4">
						<BehaviorTraitsTab />
					</TabsContent>

					<TabsContent value="preferences" className="space-y-4">
						<PreferencesTab />
					</TabsContent>
				</Tabs>

				<div className="flex gap-2 justify-end pt-4 border-t">
					<Button type="button" variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting
							? isEditMode
								? 'Updating...'
								: 'Creating...'
							: isEditMode
								? 'Update Persona'
								: 'Create Persona'}
					</Button>
				</div>
			</form>
		</Form>
	);
}

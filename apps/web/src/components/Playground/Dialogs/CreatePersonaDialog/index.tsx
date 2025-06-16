'use client';

import { useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@workspace/ui/components/dialog';
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from '@workspace/ui/components/drawer';
import { UserPlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { usePlaygroundStore } from '@/store/playground';
import { useCreatePersonaDialog, useEditPersonaDialog } from '@/store/user/selectors';
import { TemplatesCarousel } from './TemplatesCarousel';
import { CreatePersonaForm } from './CreatePersonaForm';
import { SAMPLE_PERSONAS } from './constants';
import { PersonaFormData } from './types';
import type { PersonaInsert, PersonaSelect } from '@/database/client/schema';

// Function to convert PersonaSelect to PersonaFormData
function personaToFormData(persona: PersonaSelect): PersonaFormData {
	return {
		name: persona.name,
		description: persona.description || '',
		ageGroup: (persona.ageGroup as any) || '',
		digitalSkillLevel: (persona.digitalSkillLevel as any) || '',
		behaviorTraits: (persona.behaviorTraits as any) || [],
		preferences: persona.preferences || {},
		pinned: persona.pinned,
	};
}

export default function CreatePersonaDialog() {
	const { isOpen: isCreateOpen, closeDialog: closeCreateDialog } = useCreatePersonaDialog();
	const { isOpen: isEditOpen, closeDialog: closeEditDialog } = useEditPersonaDialog();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedTemplate, setSelectedTemplate] = useState<PersonaFormData | undefined>();
	const { createPersona, updatePersona, editingPersona, setEditingPersona, personaNameExists } =
		usePlaygroundStore();

	const isEditMode = isEditOpen && editingPersona;

	const handleCreateNew = () => {
		setSelectedTemplate(undefined);
		setDialogOpen(true);
	};

	const handleSelectTemplate = (template: PersonaFormData) => {
		setSelectedTemplate(template);
		setDialogOpen(true);
		toast.success(`Loaded template: ${template.name}`);
	};

	const handleDialogClose = () => {
		setDialogOpen(false);
		setSelectedTemplate(undefined);
		if (isEditMode) {
			setEditingPersona(null);
			closeEditDialog();
		} else {
			closeCreateDialog();
		}
	};

	const handleSubmit = async (data: PersonaInsert) => {
		try {
			if (!isEditMode || (isEditMode && data.name !== editingPersona.name)) {
				const nameExists = await personaNameExists(data.name);

				if (nameExists) {
					toast.error('Persona with this name already exists');
					return;
				}
			}

			if (isEditMode) {
				await updatePersona(editingPersona.id, data);
				toast.success('Persona updated successfully!');
			} else {
				await createPersona(data);
				toast.success('Persona created successfully!');
			}

			setDialogOpen(false);
			setSelectedTemplate(undefined);
			if (isEditMode) {
				setEditingPersona(null);
				closeEditDialog();
			} else {
				closeCreateDialog();
			}
		} catch (error) {
			console.error('Failed to submit persona:', error);
			toast.error(isEditMode ? 'Failed to update persona' : 'Failed to create persona');
		}
	};

	// For edit mode, show dialog directly with persona data
	if (isEditMode) {
		return (
			<Dialog
				open={true}
				onOpenChange={(open) => {
					if (!open) {
						handleDialogClose();
					}
				}}
			>
				<DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Edit Persona: {editingPersona.name}</DialogTitle>
					</DialogHeader>

					<CreatePersonaForm
						initialData={personaToFormData(editingPersona)}
						onClose={handleDialogClose}
						onSubmit={handleSubmit}
						isEditMode={true}
					/>
				</DialogContent>
			</Dialog>
		);
	}

	// For create mode, show drawer with templates
	return (
		<>
			<Drawer
				open={isCreateOpen && !dialogOpen}
				onOpenChange={(open) => {
					if (!open) {
						closeCreateDialog();
					}
				}}
			>
				<DrawerContent>
					<div className="mx-auto w-full max-w-6xl">
						<DrawerHeader>
							<DrawerTitle>Create New Persona</DrawerTitle>
							<DrawerDescription>
								Choose from a template or create a new persona from scratch
							</DrawerDescription>
						</DrawerHeader>

						<div className="p-4 pb-0">
							<div className="space-y-6">
								{/* Create New Button */}
								<div className="flex justify-center">
									<Button onClick={handleCreateNew} className="flex items-center gap-2" size="lg">
										<UserPlusIcon className="h-5 w-5" />
										Create New Persona
									</Button>
								</div>

								{/* Templates Carousel */}
								<TemplatesCarousel
									templates={SAMPLE_PERSONAS}
									onSelectTemplate={handleSelectTemplate}
								/>
							</div>
						</div>

						<DrawerFooter>
							<DrawerClose asChild>
								<Button variant="outline">Cancel</Button>
							</DrawerClose>
						</DrawerFooter>
					</div>
				</DrawerContent>
			</Drawer>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{selectedTemplate ? `Create Persona: ${selectedTemplate.name}` : 'Create New Persona'}
						</DialogTitle>
					</DialogHeader>

					<CreatePersonaForm
						initialData={selectedTemplate}
						onClose={handleDialogClose}
						onSubmit={handleSubmit}
					/>
				</DialogContent>
			</Dialog>
		</>
	);
}

'use client';

import { useState } from 'react';
import { GenericSelect } from './base/base-select';
import { CreateEditPersonaDialog } from './dialogs/create-edit-persona';
import { CreateEditApplicationDialog } from './dialogs/create-edit-application';
import { toast } from 'sonner';
import { useAssistantContext } from '@/contexts/assistant-context';
import { useApplicationContext } from '@/contexts/application-context';
import type { Application, Persona } from '@/types';
import { assistantToPersona, personaToAssistant } from './utils';

interface SelectProps {
	userId: string | undefined;
	chatStarted: boolean;
	className?: string;
	onOpenChange?: (isOpen: boolean) => void;
}

export const PersonaSelect = (props: SelectProps) => {
	const [createEditDialogOpen, setCreateEditDialogOpen] = useState(false);
	const [editingPersona, setEditingPersona] = useState<Persona | undefined>();

	const {
		assistants,
		selectedAssistant,
		isLoadingAllAssistants,
		setSelectedAssistant,
		createCustomAssistant,
		editCustomAssistant,
		deleteAssistant,
	} = useAssistantContext();

	const handleDeletePersona = async (personaId: string) => {
		const res = await deleteAssistant(personaId);
		if (res) {
			toast.success('Persona deleted', { duration: 5000 });
		} else {
			toast.error('Failed to delete assistant', { duration: 5000 });
		}
	};

	const setSelectedPersona = (persona: Persona) => {
		setSelectedAssistant(personaToAssistant(persona));
	};

	return (
		<>
			<GenericSelect<Persona>
				userId={props.userId}
				chatStarted={props.chatStarted}
				className={props.className}
				onOpenChange={props.onOpenChange}
				items={assistants.map(assistantToPersona)}
				selectedItem={selectedAssistant ? assistantToPersona(selectedAssistant) : undefined}
				isLoading={isLoadingAllAssistants}
				getItemId={(persona) => persona.id}
				onSelectItem={setSelectedPersona}
				onDeleteItem={handleDeletePersona}
				triggerTooltip="Change persona"
				dropdownLabel="My Personas"
				createEditDialog={
					<CreateEditPersonaDialog
						allDisabled={false}
						setAllDisabled={() => {}}
						open={createEditDialogOpen}
						setOpen={(c) => {
							if (!c) {
								setEditingPersona(undefined);
							}
							setCreateEditDialogOpen(c);
						}}
						userId={props.userId}
						isEditing={!!editingPersona}
						assistantId={editingPersona?.id}
						initialData={editingPersona}
						createCustomAssistant={async ({ newAssistant, successCallback }) => {
							const res = await createCustomAssistant({
								newAssistant,
								successCallback,
							});
							setCreateEditDialogOpen(false);
							return res;
						}}
						editCustomAssistant={async ({ editedAssistant, assistantId }) => {
							const res = await editCustomAssistant({
								editedAssistant,
								assistantId,
							});
							setCreateEditDialogOpen(false);
							return res;
						}}
						isLoading={isLoadingAllAssistants}
					/>
				}
				setCreateEditDialogOpen={setCreateEditDialogOpen}
				setEditingItem={setEditingPersona}
				fallbackIcon="User"
			/>
		</>
	);
};

export const ApplicationSelect = (props: SelectProps) => {
	const [createEditDialogOpen, setCreateEditDialogOpen] = useState(false);
	const [editingApplication, setEditingApplication] = useState<Application | undefined>();

	const {
		applications,
		selectedApplication,
		isLoadingAllApplications,
		setSelectedApplication,
		createCustomApplication,
		editCustomApplication,
		deleteApplication,
	} = useApplicationContext();

	const handleDeleteApplication = async (appId: string) => {
		const res = await deleteApplication(appId);
		if (res) {
			toast.success('Application deleted', { duration: 5000 });
		} else {
			toast.error('Failed to delete application', { duration: 5000 });
		}
	};

	return (
		<>
			<GenericSelect<Application>
				userId={props.userId}
				chatStarted={props.chatStarted}
				className={props.className}
				onOpenChange={props.onOpenChange}
				items={applications}
				selectedItem={selectedApplication}
				isLoading={isLoadingAllApplications}
				getItemId={(app) => app.id}
				onSelectItem={setSelectedApplication}
				onDeleteItem={handleDeleteApplication}
				triggerTooltip="Change application"
				dropdownLabel="My Applications"
				createEditDialog={
					<CreateEditApplicationDialog
						allDisabled={false}
						setAllDisabled={() => {}}
						open={createEditDialogOpen}
						setOpen={(c) => {
							if (!c) {
								setEditingApplication(undefined);
							}
							setCreateEditDialogOpen(c);
						}}
						userId={props.userId}
						isEditing={!!editingApplication}
						application={editingApplication}
						createCustomApplication={async ({ newApplication, successCallback }) => {
							const res = await createCustomApplication({
								newApplication,
								successCallback,
							});
							setCreateEditDialogOpen(false);
							return res;
						}}
						editCustomApplication={async ({ editedApplication, applicationId }) => {
							const res = await editCustomApplication({
								editedApplication,
								applicationId,
							});
							setCreateEditDialogOpen(false);
							return res;
						}}
						isLoading={isLoadingAllApplications}
					/>
				}
				setCreateEditDialogOpen={setCreateEditDialogOpen}
				setEditingItem={setEditingApplication}
				fallbackIcon="AppWindow"
			/>
		</>
	);
};

'use client';

import React, { useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@workspace/ui/components/dialog';
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from '@workspace/ui/components/drawer';
import { BotIcon } from 'lucide-react';
import { toast } from 'sonner';
import { TighterText } from '@/components/ui/tighter-text';
import { TemplatesCarousel } from './templates-carousel';
import { PersonaForm } from './form';
import { SAMPLE_ASSISTANTS } from './constants';
import type { CreatePersonaData } from '@/types';
import type { Assistant } from '@langchain/langgraph-sdk';
import { assistantToPersona } from '../utils';
import type {
	EditCustomAssistantArgs,
	CreateCustomAssistantArgs,
} from '@/contexts/assistant-context';

export interface CreateEditAssistantDialogProps {
	userId: string | undefined;
	open: boolean;
	setOpen: (open: boolean) => void;
	isEditing: boolean;
	assistant?: Assistant;
	createCustomAssistant: (args: CreateCustomAssistantArgs) => Promise<Assistant | undefined>;
	editCustomAssistant: (args: EditCustomAssistantArgs) => Promise<Assistant | undefined>;
	isLoading: boolean;
	allDisabled: boolean;
	setAllDisabled: (disabled: boolean) => void;
}

export function CreateEditAssistantDialog(props: CreateEditAssistantDialogProps) {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedTemplate, setSelectedTemplate] = useState<CreatePersonaData | undefined>();

	const isEditMode = props.isEditing && props.assistant;

	const handleCreateNew = () => {
		setSelectedTemplate(undefined);
		setDialogOpen(true);
	};

	const handleSelectTemplate = (template: CreatePersonaData) => {
		setSelectedTemplate(template);
		setDialogOpen(true);
		toast.success(`Loaded template: ${template.name}`);
	};

	const handleDialogClose = () => {
		setDialogOpen(false);
		setSelectedTemplate(undefined);
		props.setOpen(false);
	};

	const handleFormSubmit = async (data: CreatePersonaData) => {
		if (!props.userId) {
			toast.error('User not found');
			return;
		}

		if (props.isEditing && !props.assistant) {
			toast.error('Assistant not found');
			return;
		}

		props.setAllDisabled(true);

		let success: boolean;

		if (props.isEditing && props.assistant) {
			const updatedAssistant = await props.editCustomAssistant({
				editedAssistant: data,
				assistantId: props.assistant.assistant_id,
			});
			success = !!updatedAssistant;
		} else {
			const assistant = await props.createCustomAssistant({
				newAssistant: data,
			});
			success = !!assistant;
		}

		if (success) {
			toast.success(`Assistant ${props.isEditing ? 'updated' : 'created'} successfully`);
		} else {
			toast.error(`Failed to ${props.isEditing ? 'update' : 'create'} assistant`);
		}

		props.setAllDisabled(false);
		handleDialogClose();
	};

	if (isEditMode) {
		return (
			<Dialog
				open={props.open}
				onOpenChange={(open) => {
					if (!open) {
						handleDialogClose();
					}
					props.setOpen(open);
				}}
			>
				<DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="text-3xl font-light text-gray-800">
							<TighterText>Edit Assistant: {props.assistant?.name}</TighterText>
						</DialogTitle>
						<DialogDescription className="mt-2 text-md font-light text-gray-600">
							<TighterText>Update your assistant's settings and behavior.</TighterText>
						</DialogDescription>
					</DialogHeader>

					<PersonaForm
						isEditing={true}
						initialData={assistantToPersona(props.assistant)}
						onSubmit={handleFormSubmit}
						onCancel={handleDialogClose}
						disabled={props.allDisabled}
					/>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<React.Fragment>
			<Drawer
				open={props.open && !dialogOpen}
				onOpenChange={(open) => {
					if (!open) {
						props.setOpen(false);
					}
				}}
			>
				<DrawerContent>
					<div className="mx-auto w-full max-w-6xl">
						<DrawerHeader>
							<DrawerTitle>
								<TighterText>Create New Assistant</TighterText>
							</DrawerTitle>
							<DrawerDescription>
								<TighterText>
									Choose from a template or create a new assistant from scratch
								</TighterText>
							</DrawerDescription>
						</DrawerHeader>

						<div className="p-4 pb-0">
							<div className="space-y-6">
								{/* Create New Button */}
								<div className="flex justify-center">
									<Button onClick={handleCreateNew} className="flex items-center gap-2" size="lg">
										<BotIcon className="h-5 w-5" />
										<TighterText>Create New Assistant</TighterText>
									</Button>
								</div>

								<TemplatesCarousel
									templates={SAMPLE_ASSISTANTS}
									onSelectTemplate={handleSelectTemplate}
								/>
							</div>
						</div>

						<DrawerFooter>
							<DrawerClose asChild>
								<Button variant="outline">
									<TighterText>Cancel</TighterText>
								</Button>
							</DrawerClose>
						</DrawerFooter>
					</div>
				</DrawerContent>
			</Drawer>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="text-3xl font-light text-gray-800">
							<TighterText>
								{selectedTemplate
									? `Create Assistant: ${selectedTemplate.name}`
									: 'Create New Assistant'}
							</TighterText>
						</DialogTitle>
						<DialogDescription className="mt-2 text-md font-light text-gray-600">
							<TighterText>
								Creating a new assistant allows you to tailor your interactions to a specific
								context, as conversations are unique to assistants.
							</TighterText>
						</DialogDescription>
					</DialogHeader>

					<PersonaForm
						isEditing={false}
						initialData={selectedTemplate}
						onSubmit={handleFormSubmit}
						onCancel={handleDialogClose}
						disabled={props.allDisabled}
					/>
				</DialogContent>
			</Dialog>
		</React.Fragment>
	);
}

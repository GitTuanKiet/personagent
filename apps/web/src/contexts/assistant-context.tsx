import type { Assistant } from '@langchain/langgraph-sdk';
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState } from 'react';
import { createClient } from '@/hooks/utils';
import { DEFAULT_GRAPH_ID, DEFAULT_PERSONA } from '@/constants';
import { toast } from 'sonner';
import { CreatePersonaData, UpdatePersonaData } from '@/types';

type AssistantContentType = {
	userId: string;
	assistants: Assistant[];
	selectedAssistant: Assistant | undefined;
	isLoadingAllAssistants: boolean;
	isDeletingAssistant: boolean;
	isCreatingAssistant: boolean;
	isEditingAssistant: boolean;
	getOrCreateAssistant: () => Promise<void>;
	getAssistants: () => Promise<void>;
	deleteAssistant: (assistantId: string) => Promise<boolean>;
	createCustomAssistant: (args: CreateCustomAssistantArgs) => Promise<Assistant | undefined>;
	editCustomAssistant: (args: EditCustomAssistantArgs) => Promise<Assistant | undefined>;
	setSelectedAssistant: Dispatch<SetStateAction<Assistant | undefined>>;
};

export interface CreateAssistantFields extends CreatePersonaData {}
export interface EditAssistantFields extends UpdatePersonaData {}

export type CreateCustomAssistantArgs = {
	newAssistant: CreateAssistantFields;
	successCallback?: (id: string) => void;
};

export type EditCustomAssistantArgs = {
	editedAssistant: EditAssistantFields;
	assistantId: string;
};

const AssistantContext = createContext<AssistantContentType | undefined>(undefined);

export function AssistantProvider({
	children,
	visitorId,
}: {
	children: ReactNode;
	visitorId: string;
}) {
	const [isLoadingAllAssistants, setIsLoadingAllAssistants] = useState(false);
	const [isDeletingAssistant, setIsDeletingAssistant] = useState(false);
	const [isCreatingAssistant, setIsCreatingAssistant] = useState(false);
	const [isEditingAssistant, setIsEditingAssistant] = useState(false);
	const [assistants, setAssistants] = useState<Assistant[]>([]);
	const [selectedAssistant, setSelectedAssistant] = useState<Assistant>();

	const getAssistants = async (): Promise<void> => {
		setIsLoadingAllAssistants(true);
		try {
			const client = createClient();
			const response = await client.assistants.search({
				metadata: {
					user_id: visitorId,
				},
			});
			setAssistants(response);
			setIsLoadingAllAssistants(false);
		} catch (e) {
			toast.error('Failed to get assistants', {
				description: 'Please try again later.',
			});
			console.error('Failed to get assistants', e);
			setIsLoadingAllAssistants(false);
		}
	};

	const deleteAssistant = async (assistantId: string): Promise<boolean> => {
		setIsDeletingAssistant(true);
		try {
			const client = createClient();
			await client.assistants.delete(assistantId);

			if (selectedAssistant?.assistant_id === assistantId) {
				// Get the first assistant in the list to set as default
				const defaultAssistant = assistants.find((a) => a.metadata?.isDefault) || assistants[0];
				setSelectedAssistant(defaultAssistant);
			}

			setAssistants((prev) => prev.filter((assistant) => assistant.assistant_id !== assistantId));
			setIsDeletingAssistant(false);
			return true;
		} catch (e) {
			toast.error('Failed to delete assistant', {
				description: 'Please try again later.',
			});
			console.error('Failed to delete assistant', e);
			setIsDeletingAssistant(false);
			return false;
		}
	};

	const createCustomAssistant = async ({
		newAssistant,
		successCallback,
	}: CreateCustomAssistantArgs): Promise<Assistant | undefined> => {
		setIsCreatingAssistant(true);
		try {
			let createdAssistant: Assistant;

			const client = createClient();
			const { name, ...metadata } = newAssistant;
			createdAssistant = await client.assistants.create({
				graphId: DEFAULT_GRAPH_ID,
				name,
				metadata: {
					user_id: visitorId,
					...metadata,
				},
				config: {
					configurable: {
						persona: newAssistant,
					},
				},
				ifExists: 'raise',
			});

			setAssistants((prev) => [...prev, createdAssistant]);
			setSelectedAssistant(createdAssistant);
			successCallback?.(createdAssistant.assistant_id);
			setIsCreatingAssistant(false);
			return createdAssistant;
		} catch (e) {
			toast.error('Failed to create assistant', {
				description: 'Please try again later.',
			});
			setIsCreatingAssistant(false);
			console.error('Failed to create an assistant', e);
			return undefined;
		}
	};

	const editCustomAssistant = async ({
		editedAssistant,
		assistantId,
	}: EditCustomAssistantArgs): Promise<Assistant | undefined> => {
		setIsEditingAssistant(true);
		try {
			let response: Assistant;

			const client = createClient();
			const { name, ...metadata } = editedAssistant;
			response = await client.assistants.update(assistantId, {
				name,
				graphId: DEFAULT_GRAPH_ID,
				metadata: {
					user_id: visitorId,
					...metadata,
				},
				config: {
					configurable: {
						persona: editedAssistant,
					},
				},
			});

			setAssistants((prev) =>
				prev.map((assistant) => {
					if (assistant.assistant_id === assistantId) {
						return response;
					}
					return assistant;
				}),
			);
			setIsEditingAssistant(false);
			return response;
		} catch (e) {
			console.error('Failed to edit assistant', e);
			setIsEditingAssistant(false);
			return undefined;
		}
	};

	const getOrCreateAssistant = async () => {
		if (selectedAssistant) {
			return;
		}
		setIsLoadingAllAssistants(true);

		let userAssistants: Assistant[] = [];

		try {
			const client = createClient();
			userAssistants = await client.assistants.search({
				graphId: DEFAULT_GRAPH_ID,
				metadata: {
					user_id: visitorId,
				},
				limit: 100,
			});
		} catch (e) {
			console.error('Failed to get default assistant', e);
		}

		if (!userAssistants.length) {
			await createCustomAssistant({
				newAssistant: {
					...DEFAULT_PERSONA,
					isDefault: true,
				},
			});

			setIsLoadingAllAssistants(false);
			return;
		}

		setAssistants(userAssistants);

		const defaultAssistant = userAssistants.find((assistant) => assistant.metadata?.isDefault);

		if (!defaultAssistant) {
			// Update the first assistant to be the default assistant, then set it as the selected assistant.
			const firstAssistant = userAssistants.sort((a, b) => {
				return a.created_at.localeCompare(b.created_at);
			})[0];

			const updatedAssistant = await editCustomAssistant({
				editedAssistant: Object.assign(
					{
						isDefault: true,
					},
					DEFAULT_PERSONA,
					{
						...firstAssistant.metadata,
						iconData: {
							iconName: (firstAssistant.metadata?.iconName as string | undefined) || 'User',
							iconColor: (firstAssistant.metadata?.iconColor as string | undefined) || '#000000',
						},
					},
				),
				assistantId: firstAssistant.assistant_id,
			});

			setSelectedAssistant(updatedAssistant);
		} else {
			setSelectedAssistant(defaultAssistant);
		}

		setIsLoadingAllAssistants(false);
	};

	const contextValue: AssistantContentType = {
		userId: visitorId,
		assistants,
		selectedAssistant,
		isLoadingAllAssistants,
		isDeletingAssistant,
		isCreatingAssistant,
		isEditingAssistant,
		getOrCreateAssistant,
		getAssistants,
		deleteAssistant,
		createCustomAssistant,
		editCustomAssistant,
		setSelectedAssistant,
	};

	return <AssistantContext.Provider value={contextValue}>{children}</AssistantContext.Provider>;
}

export function useAssistantContext() {
	const context = useContext(AssistantContext);
	if (context === undefined) {
		throw new Error('useAssistantContext must be used within a AssistantProvider');
	}
	return context;
}

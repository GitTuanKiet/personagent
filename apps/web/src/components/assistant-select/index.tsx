'use client';

import React, { useState } from 'react';
import { CreateEditAssistantDialog } from './create-edit-assistant';
import { toast } from 'sonner';
import { useAssistantContext } from '@/contexts/assistant-context';
import { getIcon } from './utils';
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuItem,
} from '@workspace/ui/components/dropdown-menu';
import { cn } from '@workspace/ui/lib/utils';
import { LoaderCircle, CirclePlus } from 'lucide-react';
import { AssistantItem } from './assistant-item';
import type { Assistant } from '@langchain/langgraph-sdk';

interface AssistantSelectProps {
	chatStarted: boolean;
	className?: string;
	onOpenChange?: (isOpen: boolean) => void;
}

export const AssistantSelectComponent = (props: AssistantSelectProps) => {
	const [open, setOpen] = useState(false);
	const [createEditDialogOpen, setCreateEditDialogOpen] = useState(false);
	const [editingAssistant, setEditingAssistant] = useState<Assistant | undefined>();
	const [allDisabled, setAllDisabled] = useState(false);

	const {
		userId,
		assistants,
		selectedAssistant,
		isLoadingAllAssistants,
		setSelectedAssistant,
		createCustomAssistant,
		editCustomAssistant,
		deleteAssistant,
	} = useAssistantContext();

	const handleNewAssistantClick = (event: Event) => {
		event.preventDefault();
		setCreateEditDialogOpen(true);
	};

	const handleDeleteAssistant = async (assistantId: string) => {
		setAllDisabled(true);
		const res = await deleteAssistant(assistantId);
		if (res) {
			toast.success('Assistant deleted', { duration: 5000 });
		}
		setAllDisabled(false);
		return res;
	};

	const metadata = selectedAssistant?.metadata as Record<string, any>;

	return (
		<>
			<DropdownMenu
				open={open}
				onOpenChange={(c) => {
					if (!c) {
						setEditingAssistant(undefined);
						setCreateEditDialogOpen(false);
					}

					setOpen(c);
					props.onOpenChange?.(c);
				}}
			>
				<DropdownMenuTrigger className="text-gray-600" asChild>
					<button
						className={cn(
							'size-7 mt-1 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors',
							props.className,
						)}
						style={{ color: metadata?.iconData?.iconColor || '#4b5563' }}
						title={selectedAssistant?.name}
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							setOpen(true);
						}}
					>
						{getIcon(metadata?.iconData?.iconName as string | undefined)}
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="max-h-[600px] max-w-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 ml-4">
					<DropdownMenuLabel>
						<span className="font-medium">My Personas</span>
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					{isLoadingAllAssistants && !assistants?.length ? (
						<span className="text-sm text-gray-600 flex items-center justify-start gap-1 p-2">
							Loading
							<LoaderCircle className="w-4 h-4 animate-spin" />
						</span>
					) : (
						<>
							<DropdownMenuItem
								onSelect={(e) => {
									handleNewAssistantClick(e);
								}}
								className="flex items-center justify-start gap-2"
								disabled={allDisabled}
							>
								<CirclePlus className="w-4 h-4" />
								<span className="font-medium">New</span>
							</DropdownMenuItem>
							{assistants.map((assistant) => (
								<AssistantItem
									setAllDisabled={setAllDisabled}
									allDisabled={allDisabled}
									key={assistant.assistant_id}
									assistant={assistant}
									setEditModalOpen={setCreateEditDialogOpen}
									setAssistantDropdownOpen={setOpen}
									setEditingAssistant={setEditingAssistant}
									deleteAssistant={handleDeleteAssistant}
									selectedAssistantId={selectedAssistant?.assistant_id}
									onClick={() => {
										if (selectedAssistant?.assistant_id === assistant.assistant_id) {
											setOpen(false);
											return;
										}
										setSelectedAssistant(assistant);
									}}
								/>
							))}
						</>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
			<CreateEditAssistantDialog
				allDisabled={allDisabled}
				setAllDisabled={setAllDisabled}
				open={createEditDialogOpen}
				setOpen={(c) => {
					if (!c) {
						setEditingAssistant(undefined);
					}
					setCreateEditDialogOpen(c);
				}}
				isEditing={!!editingAssistant}
				assistant={editingAssistant}
				userId={userId}
				createCustomAssistant={async ({ newAssistant, successCallback }) => {
					const res = await createCustomAssistant({
						newAssistant,
						successCallback,
					});
					setOpen(false);
					return res;
				}}
				editCustomAssistant={async ({ editedAssistant, assistantId }) => {
					const res = await editCustomAssistant({
						editedAssistant,
						assistantId,
					});
					setOpen(false);
					return res;
				}}
				isLoading={isLoadingAllAssistants}
			/>
		</>
	);
};

export const AssistantSelect = React.memo(AssistantSelectComponent);

'use client';

import { DropdownMenuItem } from '@workspace/ui/components/dropdown-menu';
import React, { Dispatch, MouseEventHandler, SetStateAction } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { getIcon } from './utils';
import { EditDeleteDropdown } from './edit-delete-dropdown';
import type { Assistant } from '@langchain/langgraph-sdk';

interface AssistantItemProps {
	assistant: Assistant;
	allDisabled: boolean;
	selectedAssistantId: string | undefined;
	setAllDisabled: Dispatch<SetStateAction<boolean>>;
	onClick: MouseEventHandler<HTMLDivElement>;
	setEditModalOpen: Dispatch<SetStateAction<boolean>>;
	deleteAssistant: (assistantId: string) => Promise<boolean>;
	setAssistantDropdownOpen: Dispatch<SetStateAction<boolean>>;
	setEditingAssistant: Dispatch<SetStateAction<Assistant | undefined>>;
}

export function AssistantItem({
	assistant,
	selectedAssistantId,
	onClick,
	deleteAssistant,
	allDisabled,
	setAllDisabled,
	setEditModalOpen,
	setAssistantDropdownOpen,
	setEditingAssistant,
}: AssistantItemProps) {
	const isDefault = assistant.metadata?.isDefault as boolean | undefined;
	const isSelected = assistant.assistant_id === selectedAssistantId;
	const metadata = assistant.metadata as Record<string, any>;

	return (
		<div className="flex items-center justify-between w-full gap-1">
			<DropdownMenuItem
				className={cn('flex items-center justify-start gap-2 w-full', isSelected && 'bg-gray-50')}
				onClick={onClick}
				disabled={allDisabled}
			>
				<span
					style={{ color: metadata?.iconData?.iconColor || '#4b5563' }}
					className="flex items-center justify-start w-4 h-4"
				>
					{getIcon(metadata?.iconData?.iconName as string | undefined)}
				</span>
				{assistant.name}
				{isDefault && <span className="text-xs text-gray-500 ml-auto">{'(mặc định)'}</span>}
			</DropdownMenuItem>
			<EditDeleteDropdown
				allowDelete={!isDefault}
				setDisabled={setAllDisabled}
				disabled={allDisabled}
				setEditingAssistant={setEditingAssistant}
				setEditModalOpen={setEditModalOpen}
				deleteAssistant={deleteAssistant}
				setAssistantDropdownOpen={setAssistantDropdownOpen}
				selectedAssistant={assistant}
			/>
		</div>
	);
}

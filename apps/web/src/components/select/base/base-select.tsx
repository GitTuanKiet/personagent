'use client';

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { useState, ReactNode } from 'react';
import React from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { getIcon } from '../utils';
import { EditDeleteDropdown } from './edit-delete-dropdown';
import type { Application, Persona } from '@/types';
import { CirclePlus, LoaderCircle } from 'lucide-react';

interface GenericItemProps<T extends Persona | Application> {
	item: T;
	allDisabled: boolean;
	selectedItemId: string | null;
	setAllDisabled: (disabled: boolean) => void;
	onClick: () => void;
	deleteItem: (itemId: string) => Promise<void>;
	setEditModalOpen: (open: boolean) => void;
	setDropdownOpen: (open: boolean) => void;
	setEditingItem: (item: T) => void;
	fallbackIcon?: string;
}

function GenericItem<T extends Persona | Application>({
	item,
	selectedItemId,
	onClick,
	deleteItem,
	allDisabled,
	setAllDisabled,
	setEditModalOpen,
	setDropdownOpen,
	setEditingItem,
	fallbackIcon,
}: GenericItemProps<T>) {
	const isSelected = selectedItemId === item.id;
	const isDefault =
		'isDefault' in item ? item.isDefault : 'isActive' in item ? item.isActive : false;

	return (
		<div className="flex items-center justify-center w-full gap-1">
			<DropdownMenuItem
				className={cn(
					'flex items-center justify-between gap-2',
					isSelected && 'bg-black text-black',
				)}
				onSelect={(e) => {
					e.preventDefault();
					onClick();
				}}
				disabled={allDisabled}
			>
				<span
					style={{ color: item.iconData?.iconColor || '#4b5563' }}
					className="flex items-center justify-start w-4 h-4"
				>
					{getIcon(item.iconData?.iconName as string | undefined, fallbackIcon)}
				</span>
				{item.name}
				{isDefault && <span className="text-xs text-gray-500 ml-auto">{'(default)'}</span>}
				{isSelected && <span className="ml-auto">•</span>}
			</DropdownMenuItem>
			<EditDeleteDropdown<T>
				allowDelete={!isDefault}
				setDisabled={setAllDisabled}
				disabled={allDisabled}
				setEditingItem={setEditingItem}
				setEditModalOpen={setEditModalOpen}
				deleteItem={deleteItem}
				setDropdownOpen={setDropdownOpen}
				selectedItem={item}
			/>
		</div>
	);
}

interface GenericSelectProps<T extends Persona | Application> {
	userId: string | undefined;
	chatStarted: boolean;
	className?: string;
	onOpenChange?: (isOpen: boolean) => void;

	// Data & State
	items: T[];
	selectedItem: T | null;
	isLoading: boolean;
	getItemId: (item: T) => string;

	// CRUD operations
	onSelectItem: (item: T) => void;
	onDeleteItem: (itemId: string) => Promise<void>;

	// Dialog
	createEditDialog: ReactNode;
	setCreateEditDialogOpen: (open: boolean) => void;
	setEditingItem: (item: T | undefined) => void;

	// UI Customization
	triggerTooltip: string;
	dropdownLabel: string;
	fallbackIcon?: string;
}

function GenericSelectComponent<T extends Persona | Application>(props: GenericSelectProps<T>) {
	const [open, setOpen] = useState(false);
	const [allDisabled, setAllDisabled] = useState(false);

	const triggerColor = props.selectedItem?.iconData?.iconColor || '#4b5563';

	const handleNewClick = (e: Event) => {
		e.preventDefault();
		props.setCreateEditDialogOpen(true);
	};

	const handleDeleteItem = async (itemId: string) => {
		setAllDisabled(true);
		await props.onDeleteItem(itemId);
		setAllDisabled(false);
	};

	return (
		<>
			<DropdownMenu
				open={open}
				onOpenChange={(c) => {
					if (!c) {
						props.setEditingItem(undefined);
						props.setCreateEditDialogOpen(false);
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
						style={{ color: triggerColor }}
						title={props.triggerTooltip}
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							setOpen(true);
						}}
					>
						{getIcon(props.selectedItem?.iconData?.iconName as string | undefined)}
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="max-h-[600px] max-w-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 ml-4">
					<DropdownMenuLabel>
						<span className="font-medium">{props.dropdownLabel}</span>
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					{props.isLoading && !props.items?.length ? (
						<span className="text-sm text-gray-600 flex items-center justify-start gap-1 p-2">
							Loading
							<LoaderCircle className="w-4 h-4 animate-spin" />
						</span>
					) : (
						<>
							<DropdownMenuItem
								onSelect={handleNewClick}
								className="flex items-center justify-start gap-2"
								disabled={allDisabled}
							>
								<CirclePlus className="w-4 h-4" />
								<span className="font-medium">New</span>
							</DropdownMenuItem>
							{props.items.map((item, index) => (
								<GenericItem
									key={index}
									item={item}
									selectedItemId={props.selectedItem ? props.getItemId(props.selectedItem) : null}
									onClick={() => {
										if (
											props.selectedItem &&
											props.getItemId(props.selectedItem) === props.getItemId(item)
										) {
											setOpen(false);
											return;
										}
										props.onSelectItem(item);
									}}
									allDisabled={allDisabled}
									setAllDisabled={setAllDisabled}
									setEditModalOpen={props.setCreateEditDialogOpen}
									setDropdownOpen={setOpen}
									setEditingItem={props.setEditingItem}
									deleteItem={handleDeleteItem}
									fallbackIcon={props.fallbackIcon}
								/>
							))}
						</>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
			{props.createEditDialog}
		</>
	);
}

export const GenericSelect = React.memo(GenericSelectComponent) as <
	T extends Persona | Application,
>(
	props: GenericSelectProps<T>,
) => React.ReactElement;

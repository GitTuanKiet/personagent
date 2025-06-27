import { Dispatch, SetStateAction, useState } from 'react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react';
import type { Application, Persona } from '@/types';
import { TooltipIconButton } from '@/components/assistant-ui/tooltip-icon-button';
import styles from './edit-delete-dropdown.module.css';

interface EditDeleteDropdownProps<T extends Persona | Application> {
	setEditModalOpen: Dispatch<SetStateAction<boolean>>;
	deleteItem: (itemId: string) => Promise<void>;
	setDropdownOpen: Dispatch<SetStateAction<boolean>>;
	setEditingItem: Dispatch<SetStateAction<T | undefined>>;
	selectedItem: T;
	disabled: boolean;
	allowDelete: boolean;
	setDisabled: Dispatch<SetStateAction<boolean>>;
}

export function EditDeleteDropdown<T extends Persona | Application>({
	setEditModalOpen,
	setEditingItem,
	deleteItem,
	setDropdownOpen,
	setDisabled,
	allowDelete,
	selectedItem,
	disabled,
}: EditDeleteDropdownProps<T>) {
	const [open, setOpen] = useState(false);

	const tooltipText = allowDelete ? 'Edit/Delete' : 'Edit';

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<TooltipIconButton
					disabled={disabled}
					tooltip={tooltipText}
					variant="ghost"
					delayDuration={200}
					className="w-8 h-8"
				>
					<EllipsisVertical className="w-4 h-4" />
				</TooltipIconButton>
			</DropdownMenuTrigger>
			<DropdownMenuContent className={styles.dropdownContent}>
				<DropdownMenuItem
					onClick={() => {
						setEditingItem(selectedItem);
						setEditModalOpen(true);
					}}
					className="w-8"
					disabled={disabled}
				>
					<Pencil className="text-gray-600 hover:text-black transition-colors ease-in-out duration-200" />
				</DropdownMenuItem>
				{allowDelete && (
					<DropdownMenuItem
						onClick={async () => {
							setDisabled(true);
							await deleteItem(selectedItem.id);
							setDisabled(false);
							setOpen(false);
							setDropdownOpen(false);
						}}
						disabled={disabled}
						className="w-8"
					>
						<Trash2 className="text-gray-600 hover:text-red-500 transition-colors ease-in-out duration-200" />
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

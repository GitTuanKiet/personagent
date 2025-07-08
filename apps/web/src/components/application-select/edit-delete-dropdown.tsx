import { useState } from 'react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react';
import { TooltipIconButton } from '@/components/assistant-ui/tooltip-icon-button';

interface ApplicationDropdownProps {
	onEdit: () => void;
	onDelete: () => Promise<void>;
	disabled?: boolean;
}

export function ApplicationEditDeleteDropdown({
	onEdit,
	onDelete,
	disabled,
}: ApplicationDropdownProps) {
	const [open, setOpen] = useState(false);

	const tooltipText = 'Edit/Delete';

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
			<DropdownMenuContent>
				<DropdownMenuItem
					disabled={disabled}
					onClick={() => {
						onEdit();
						setOpen(false);
					}}
					className="w-8"
				>
					<Pencil className="text-gray-600 hover:text-black transition-colors" />
				</DropdownMenuItem>
				<DropdownMenuItem
					disabled={disabled}
					onClick={async () => {
						await onDelete();
						setOpen(false);
					}}
					className="w-8"
				>
					<Trash2 className="text-gray-600 hover:text-red-500 transition-colors" />
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

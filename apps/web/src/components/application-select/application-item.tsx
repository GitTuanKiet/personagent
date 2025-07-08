import { Application } from './utils';
import { DropdownMenuItem } from '@workspace/ui/components/dropdown-menu';
import { cn } from '@workspace/ui/lib/utils';
import { ApplicationEditDeleteDropdown } from './edit-delete-dropdown';

interface ApplicationItemProps {
	app: Application;
	isSelected: boolean;
	onClick: () => void;
	onEdit: () => void;
	onDelete: () => Promise<void>;
}

export const ApplicationItem = ({
	app,
	isSelected,
	onClick,
	onEdit,
	onDelete,
}: ApplicationItemProps) => {
	return (
		<div className="flex items-center justify-between w-full gap-1">
			<DropdownMenuItem
				className={cn('flex items-center justify-start gap-2 w-full', isSelected && 'bg-gray-50')}
				onClick={onClick}
			>
				{app.name}
			</DropdownMenuItem>
			<ApplicationEditDeleteDropdown onEdit={onEdit} onDelete={onDelete} />
		</div>
	);
};

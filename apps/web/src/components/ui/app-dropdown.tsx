import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Button } from '@workspace/ui/components/button';
import { ChevronDown, AppWindow, Plus } from 'lucide-react';
import type { Application } from '@/types';
import { useState } from 'react';

interface AppDropdownProps {
	items: Application[];
	selectedItem: Application;
	onSelect: (app: Application) => void;
	onNew: () => void;
}

export const AppDropdown = ({ items, selectedItem, onSelect, onNew }: AppDropdownProps) => {
	const [open, setOpen] = useState(false);

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					className="text-gray-500 hover:text-gray-700 transition-colors ease-in rounded-2xl flex items-center justify-between gap-2 w-[250px] h-[64px] px-4"
				>
					<div className="flex items-center gap-2">
						<AppWindow className="w-4 h-4" />
						<span className="truncate">{selectedItem.name}</span>
					</div>
					<ChevronDown className="w-4 h-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-[250px] max-h-[400px] overflow-y-auto">
				<DropdownMenuLabel>Choose Application</DropdownMenuLabel>
				<DropdownMenuSeparator />

				<DropdownMenuItem
					onClick={() => {
						onNew();
						setOpen(false);
					}}
					className="flex items-center gap-2 cursor-pointer"
				>
					<Plus className="w-4 h-4" />
					<span className="font-medium">New Application</span>
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				{items.map((app) => (
					<DropdownMenuItem
						key={app.id}
						onClick={() => {
							onSelect(app);
							setOpen(false);
						}}
						className="flex items-center gap-2 cursor-pointer"
					>
						<AppWindow className="w-4 h-4" />
						<div className="flex flex-col flex-1">
							<span className="font-medium">{app.name}</span>
							{app.description && (
								<span className="text-xs text-gray-500 truncate">{app.description}</span>
							)}
						</div>
						{selectedItem.id === app.id && <span className="text-blue-500">•</span>}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

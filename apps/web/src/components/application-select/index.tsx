'use client';

import React, { useState } from 'react';
import { Application } from '@/lib/appApi';
import { ApplicationCreateEditDialog } from './create-edit-application/dialog';
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuItem,
} from '@workspace/ui/components/dropdown-menu';
import { CirclePlus, AppWindow } from 'lucide-react';
import { ApplicationItem } from './application-item';
import { toast } from 'sonner';
import { useApplicationContext } from '@/contexts/application-context';

export const ApplicationSelectComponent = () => {
	const [openDropdown, setOpenDropdown] = useState(false);
	const { applications, createApplication, updateApplication, deleteApplication } =
		useApplicationContext();
	const [openDialog, setOpenDialog] = useState(false);
	const { selectedApplication, setSelectedApplication } = useApplicationContext();
	const [selected, setSelected] = useState<Application | null>(selectedApplication ?? null);
	const [editingApp, setEditingApp] = useState<Application | null>(null);

	const handleSelect = (app: Application | null) => {
		setSelected(app);
		setSelectedApplication(app);
	};

	const handleCreate = (app: Application) => {
		createApplication(app);
		handleSelect(app);
	};

	const handleUpdate = (app: Application) => {
		updateApplication(app.id, app as any);
		handleSelect(app);
	};

	const handleDelete = async () => {
		if (!selected) return;
		if (!confirm('Delete selected application?')) return;
		const success = await deleteApplication(selected.id);
		if (success) {
			handleSelect(null);
		}
	};

	return (
		<div>
			<DropdownMenu
				open={openDropdown}
				onOpenChange={(o) => {
					setOpenDropdown(o);
					if (!o) setEditingApp(null);
				}}
			>
				<DropdownMenuTrigger asChild>
					<button
						className="px-3 py-2 border rounded-md text-sm text-gray-700 flex items-center gap-2 hover:bg-gray-50"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							setOpenDropdown(true);
						}}
					>
						<AppWindow className="w-4 h-4" />
						{selected ? selected.name : 'Chọn Application'}
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="max-h-[500px] w-56 overflow-y-auto ml-4">
					<DropdownMenuLabel className="font-medium">My Applications</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onSelect={(e) => {
							e.preventDefault();
							setEditingApp(null);
							setOpenDialog(true);
						}}
						className="flex items-center gap-2"
					>
						<CirclePlus className="w-4 h-4" />
						<span className="font-medium">New</span>
					</DropdownMenuItem>
					{applications.map((app) => (
						<ApplicationItem
							key={app.id}
							app={app}
							isSelected={app.id === selected?.id}
							onClick={() => {
								handleSelect(app);
								setOpenDropdown(false);
							}}
							onEdit={() => {
								setEditingApp(app);
								setOpenDialog(true);
							}}
							onDelete={async () => {
								await deleteApplication(app.id);
								if (selected?.id === app.id) {
									handleSelect(null);
								}
								toast.success('Deleted');
							}}
						/>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
			<ApplicationCreateEditDialog
				open={openDialog}
				onOpenChange={setOpenDialog}
				onCreate={handleCreate}
				onUpdate={handleUpdate}
				application={editingApp ?? undefined}
			/>
		</div>
	);
};

export const ApplicationSelect = React.memo(ApplicationSelectComponent);

'use client';

import { Button } from '@workspace/ui/components/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@workspace/ui/components/select';
import { Separator } from '@workspace/ui/components/separator';
import { MonitorIcon, PlusIcon, MenuIcon, UserIcon, EditIcon } from 'lucide-react';
import { toast } from 'sonner';
import { usePlaygroundStore } from '@/store/playground';
import { useUserStore } from '@/store/user';
import { useCreateApplicationDialog, useEditApplicationDialog } from '@/store/user/selectors';
import PanelModeToggle from './PanelModeToggle';
import BaseHeader from './BaseHeader';
import type { ApplicationSelect } from '@/database/client/schema';

export default function Header() {
	// Playground actions
	const {
		applications,
		handlePinnedApplication,
		getPinnedApplication,
		handleNewSimulation,
		deleteApplication,
		setEditingApplication,
	} = usePlaygroundStore();

	// UI states from userStore
	const sidebarCollapsed = useUserStore((state) => state.ui.sidebarCollapsed);
	const personaSidebarCollapsed = useUserStore((state) => state.ui.personaSidebarCollapsed);

	const updateUIPreferences = useUserStore((state) => state.updateUIPreferences);

	// Dialog hooks
	const { openDialog: openCreateAppDialog } = useCreateApplicationDialog();
	const { openDialog: openEditAppDialog } = useEditApplicationDialog();

	// Get pinned items
	const pinnedApplication = getPinnedApplication();

	const handleApplicationSelect = (value: string) => {
		console.log('Application selected:', value);
		if (value === 'create-new') {
			openCreateAppDialog();
		} else {
			const application = applications.find((a) => a.id === Number(value));
			console.log('Found application:', application);
			if (application) {
				handlePinnedApplication(application.id);
			}
		}
	};

	const handleEditApplication = (application: ApplicationSelect) => {
		setEditingApplication(application);
		openEditAppDialog();
	};

	const toggleSidebar = () => {
		updateUIPreferences({ sidebarCollapsed: !sidebarCollapsed });
	};

	const togglePersonaSidebar = () => {
		updateUIPreferences({ personaSidebarCollapsed: !personaSidebarCollapsed });
	};

	return (
		<BaseHeader>
			<div className="flex items-center gap-2">
				{/* Sidebar Toggle + New Simulation */}
				<div className="flex items-center gap-2">
					{sidebarCollapsed && (
						<>
							<Button
								variant="ghost"
								size="sm"
								onClick={toggleSidebar}
								className="p-2"
								title="Toggle Sidebar"
							>
								<MenuIcon size={16} />
							</Button>
							<Button
								onClick={() => handleNewSimulation()}
								variant="ghost"
								size="sm"
								className="p-2"
								title="New Simulation"
							>
								<PlusIcon size={16} />
							</Button>
							<Separator orientation="vertical" className="h-6" />
						</>
					)}
				</div>

				{/* Application Selection */}
				<div className="flex items-center gap-2">
					<Select
						value={pinnedApplication?.id?.toString() || ''}
						onValueChange={handleApplicationSelect}
					>
						<SelectTrigger className="w-64">
							<div className="flex items-center gap-2">
								<SelectValue placeholder="Select application..." />
							</div>
						</SelectTrigger>
						<SelectContent>
							{applications.map((app) => (
								<SelectItem key={app.id} value={app.id.toString()}>
									<div className="flex items-center gap-2">
										<MonitorIcon size={12} />
										{app.name}
									</div>
								</SelectItem>
							))}
							<SelectItem value="create-new" className="text-primary font-medium">
								<div className="flex items-center gap-2">
									<PlusIcon size={12} />
									Create New Application
								</div>
							</SelectItem>
						</SelectContent>
					</Select>

					{/* Edit Application Button */}
					{pinnedApplication && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => handleEditApplication(pinnedApplication)}
							className="p-2"
							title="Edit Application"
						>
							<EditIcon size={16} />
						</Button>
					)}
				</div>
			</div>

			<div className="flex items-center gap-2">
				{/* Layout Controls */}
				<PanelModeToggle variant="compact" />

				{/* Separator */}
				{personaSidebarCollapsed && <Separator orientation="vertical" className="h-6" />}

				{/* Additional Toggles */}
				<div className="flex items-center gap-1">
					{/* Persona Sidebar Toggle */}
					{personaSidebarCollapsed && (
						<Button
							variant="ghost"
							size="sm"
							onClick={togglePersonaSidebar}
							className="p-2"
							title="Toggle Persona Sidebar"
						>
							<UserIcon size={16} />
						</Button>
					)}
				</div>
			</div>
		</BaseHeader>
	);
}

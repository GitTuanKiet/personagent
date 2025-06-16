'use client';

import { useEffect } from 'react';
import { usePlaygroundStore } from '@/store/playground';
import { useGlobalStore } from '@/store/global';
import { Header } from './TopHeader';
import { Sidebar } from './LeftSidebar';
import { PersonaSidebar } from './RightSidebar';
import MainContent from './MainContent';
import { CreateApplicationDialog, CreatePersonaDialog, PersonalizationDialog } from './Dialogs';
import { ClientDatabaseInitStage } from '@/database/client/types';

export default function PlaygroundPage() {
	// Main store for data loading only
	const { loadPersonas, getApplications } = usePlaygroundStore();

	// UI states from user store - separate calls to avoid object creation
	const initClientDBStage = useGlobalStore((state) => state.initClientDBStage);

	// Load initial data
	useEffect(() => {
		if (initClientDBStage === ClientDatabaseInitStage.Ready) {
			loadPersonas();
			getApplications();
		}
	}, [loadPersonas, getApplications, initClientDBStage]);

	return (
		<div className="h-screen flex bg-background">
			{/* Left Sidebar - Simulation History */}
			<Sidebar />

			{/* Main Content Area */}
			<div className="flex-1 flex flex-col">
				{/* Top Header */}
				<Header />

				{/* Main Content */}
				<MainContent />
			</div>

			{/* Right Sidebar - Persona Selection */}
			<PersonaSidebar />

			{/* Dialogs */}
			<CreateApplicationDialog />
			<CreatePersonaDialog />
			<PersonalizationDialog />
		</div>
	);
}

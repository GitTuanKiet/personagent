'use client';
import { useGlobalStore } from '@/store/global';
import { ClientDatabaseInitStage } from '@/database/client/types';
import { useEffect } from 'react';
import {
	Header,
	Sidebar,
	PersonaSidebar,
	CreateApplicationDialog,
	CreatePersonaDialog,
	PersonalizationDialog,
} from '@/components/Playground';
import { usePlaygroundStore } from '@/store/playground';

interface PlaygroundLayoutProps {
	children: React.ReactNode;
}

export default function PlaygroundLayout({ children }: PlaygroundLayoutProps) {
	const { loadPersonas, getApplications } = usePlaygroundStore();

	const initClientDBStage = useGlobalStore((state) => state.initClientDBStage);

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
				{children}
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

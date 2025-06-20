'use client';

import { memo } from 'react';
import { useUserStore } from '@/store/user';
import CreatePersonaDialog from '../Dialogs/CreatePersonaDialog';
import { TopHeader } from './TopHeader';
import { PersonaList } from './PersonaList';
import { PersonaProfile } from './PersonaProfile';
import { ActionButtons } from './ActionButtons';

export const PersonaSidebar = memo(function PersonaSidebar() {
	const { personaSidebarCollapsed } = useUserStore((state) => state.ui);

	if (personaSidebarCollapsed) {
		return null;
	}

	return (
		<div className="w-80 border-l bg-muted/30 flex flex-col">
			{/* Fixed height sections */}
			<TopHeader />
			<ActionButtons />

			{/* Flexible height section */}
			<div className="flex-1 min-h-0">
				<PersonaList />
			</div>

			{/* Fixed height section */}
			<PersonaProfile />

			<CreatePersonaDialog />
		</div>
	);
});

'use client';

import { memo } from 'react';
import { useUserStore } from '@/store/user';
import TopHeader from './TopHeader';
import ActionButtons from './ActionButtons';
import SimulationList from './SimulationList';
import BottomFooter from './BottomFooter';
import { Label } from '@workspace/ui/components/label';

export const Sidebar = memo(function Sidebar() {
	const { sidebarCollapsed } = useUserStore((state) => state.ui);

	if (sidebarCollapsed) {
		return null;
	}

	return (
		<div className="w-1/6 min-w-[240px] max-w-[300px] border-r bg-muted/30 flex flex-col h-screen">
			{/* Fixed height sections */}
			<TopHeader />
			<ActionButtons />

			{/* Flexible height section */}
			<div className="flex-1 min-h-0">
				<SimulationList />
			</div>

			{/* Fixed height section */}
			<BottomFooter />
		</div>
	);
});

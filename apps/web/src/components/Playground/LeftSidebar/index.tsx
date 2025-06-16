'use client';

import { useUserStore } from '@/store/user';
import TopHeader from './TopHeader';
import ActionButtons from './ActionButtons';
import SimulationList from './SimulationList';
import BottomFooter from './BottomFooter';
import { Label } from '@workspace/ui/components/label';

export function Sidebar() {
	const { sidebarCollapsed } = useUserStore((state) => state.ui);

	if (sidebarCollapsed) {
		return null;
	}

	return (
		<div className="w-80 border-r bg-muted/30 flex flex-col h-screen">
			{/* Fixed height sections */}
			<TopHeader />
			<ActionButtons />

			{/* Flexible height section */}
			<div className="flex-1 min-h-0">
				<Label className="text-xs font-medium px-2 py-1">Simulations</Label>
				<SimulationList />
			</div>

			{/* Fixed height section */}
			<BottomFooter />
		</div>
	);
}

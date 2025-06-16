'use client';

import { Button } from '@workspace/ui/components/button';
import { BotIcon, MenuIcon } from 'lucide-react';
import { useUserStore } from '@/store/user';
import BaseHeader from '../TopHeader/BaseHeader';

export default function TopHeader() {
	const { sidebarCollapsed } = useUserStore((state) => state.ui);
	const updateUIPreferences = useUserStore((state) => state.updateUIPreferences);

	const toggleSidebar = () => {
		updateUIPreferences({ sidebarCollapsed: !sidebarCollapsed });
	};

	return (
		<BaseHeader>
			<div className="flex items-center gap-2">
				<BotIcon className="text-primary" size={20} />
				<h2 className="font-semibold">PersonAgent</h2>
			</div>
			<Button onClick={toggleSidebar} size="sm" variant="ghost" className="p-2">
				<MenuIcon size={16} />
			</Button>
		</BaseHeader>
	);
}

import { Button } from '@workspace/ui/components/button';
import { UserIcon, MenuIcon } from 'lucide-react';
import { useUserStore } from '@/store/user';
import BaseHeader from '../TopHeader/BaseHeader';

export function TopHeader() {
	const { personaSidebarCollapsed } = useUserStore((state) => state.ui);
	const updateUIPreferences = useUserStore((state) => state.updateUIPreferences);

	const toggleSidebar = () => {
		updateUIPreferences({ personaSidebarCollapsed: !personaSidebarCollapsed });
	};

	return (
		<BaseHeader>
			<div className="flex items-center gap-2">
				<UserIcon className="text-primary" size={20} />
				<h2 className="font-semibold">Personas</h2>
			</div>
			<Button
				onClick={toggleSidebar}
				size="sm"
				variant="ghost"
				className="p-2"
				title="Toggle Persona Sidebar"
			>
				<MenuIcon size={16} />
			</Button>
		</BaseHeader>
	);
}

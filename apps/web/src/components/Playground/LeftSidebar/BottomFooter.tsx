'use client';

import { Button } from '@workspace/ui/components/button';
import { SettingsIcon } from 'lucide-react';
import { usePersonalizationDialog } from '@/store/user/selectors';

export default function BottomFooter() {
	const { openDialog } = usePersonalizationDialog();

	return (
		<div className="p-3 bg-transparent">
			<Button
				variant="outline"
				onClick={() => openDialog()}
				className="w-full gap-2 justify-start rounded-lg shadow-sm hover:shadow-md transition-all duration-200 h-10 font-medium"
			>
				<SettingsIcon size={16} />
				<span className="text-sm">Personalization</span>
			</Button>
		</div>
	);
}

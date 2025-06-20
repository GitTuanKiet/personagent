'use client';

import { useRouter } from 'next/navigation';
import { PlusIcon } from 'lucide-react';
import { usePlaygroundStore } from '@/store/playground';
import { useUserStore } from '@/store/user';
import { Label } from '@workspace/ui/components/label';

export default function ActionButtons() {
	const router = useRouter();
	const { newSimulation } = usePlaygroundStore();
	const { setPanelMode } = useUserStore();

	const handleOnClick = () => {
		setPanelMode('chat');
		newSimulation(() => router.push('/playground/new'));
	};

	return (
		<div className="px-3 py-2">
			<button
				onClick={handleOnClick}
				className="w-full p-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-muted/50 flex items-center gap-2"
			>
				<PlusIcon size={14} className="text-muted-foreground" />
				<Label className="text-xs font-medium cursor-pointer">New Simulation</Label>
			</button>
		</div>
	);
}

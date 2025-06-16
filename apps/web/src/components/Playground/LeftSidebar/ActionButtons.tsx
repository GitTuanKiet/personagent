'use client';

import { PlusIcon } from 'lucide-react';
import { usePlaygroundStore } from '@/store/playground';
import { Label } from '@workspace/ui/components/label';

export default function ActionButtons() {
	const { handleNewSimulation } = usePlaygroundStore();

	return (
		<div className="px-3 py-2">
			<button
				onClick={() => handleNewSimulation()}
				className="w-full p-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-muted/50 flex items-center gap-2"
			>
				<PlusIcon size={14} className="text-muted-foreground" />
				<Label className="text-xs font-medium cursor-pointer">New Simulation</Label>
			</button>
		</div>
	);
}

'use client';

import { PlusIcon } from 'lucide-react';
import { useCreatePersonaDialog } from '@/store/user/selectors';
import { Label } from '@workspace/ui/components/label';

export function ActionButtons() {
	const { openDialog } = useCreatePersonaDialog();

	return (
		<div className="px-3 py-2">
			<button
				onClick={() => openDialog()}
				className="w-full p-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-muted/50 flex items-center gap-2"
			>
				<PlusIcon size={14} className="text-muted-foreground" />
				<Label className="text-xs font-medium cursor-pointer">New Persona</Label>
			</button>
		</div>
	);
}

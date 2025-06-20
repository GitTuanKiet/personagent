'use client';

import { Tabs } from '@workspace/ui/components/tabs';
import { usePlaygroundStore } from '@/store/playground';
import { useUserStore } from '@/store/user';
import { TerminalHeader } from './TerminalHeader';
import { TerminalContent } from './TerminalContent';

export default function TerminalPanel() {
	// Get data from stores
	const currentSimulation = usePlaygroundStore((state) => state.currentSimulation);

	// Get UI state from user store
	const { terminalPanelCollapsed, terminalPosition } = useUserStore((state) => state.ui);

	if (terminalPanelCollapsed) {
		return null;
	}

	// Right position: Header and Content side by side (horizontal layout)
	if (terminalPosition === 'right') {
		return (
			<div className="h-full bg-background flex flex-row">
				<Tabs defaultValue="results" className="flex flex-row h-full w-full" orientation="vertical">
					<TerminalHeader state={currentSimulation?.state} />
					<TerminalContent state={currentSimulation?.state} />
				</Tabs>
			</div>
		);
	}

	// Bottom position: Header and Content stacked vertically (default layout)
	return (
		<div className="h-full bg-background flex flex-col">
			<Tabs defaultValue="results" className="flex flex-col h-full">
				<TerminalHeader state={currentSimulation?.state} />
				<TerminalContent state={currentSimulation?.state} />
			</Tabs>
		</div>
	);
}

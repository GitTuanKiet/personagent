'use client';

import { useUserStore } from '@/store/user';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@workspace/ui/components/resizable';
import { Button } from '@workspace/ui/components/button';
import { ChevronUpIcon, SidebarIcon } from 'lucide-react';
import ViewPanel from './ViewPanel';
import TerminalPanel from './TerminalPanel';

export default function MainContent() {
	// Get UI state
	const terminalPanelCollapsed = useUserStore((state) => state.ui.terminalPanelCollapsed);
	const terminalPosition = useUserStore((state) => state.ui.terminalPosition);
	const updateUIPreferences = useUserStore((state) => state.updateUIPreferences);
	const setPanelSize = useUserStore((state) => state.setPanelSize);
	const resizablePanelSize = useUserStore((state) => state.panels.resizablePanelSize) || 25;

	const showTerminalPanel = () => {
		updateUIPreferences({ terminalPanelCollapsed: false });

		// Ensure minimum size when showing terminal
		if (resizablePanelSize <= 5) {
			setPanelSize(25);
		}
	};

	// Handle panel resize for both directions
	const handleBottomPanelResize = (sizes: number[]) => {
		if (sizes.length >= 2 && sizes[1] !== undefined) {
			const terminalHeight = sizes[1];
			setPanelSize(terminalHeight);

			// Auto-collapse when resized to very small size
			if (terminalHeight <= 1) {
				updateUIPreferences({ terminalPanelCollapsed: true });
			}
			// Ensure panel is shown when resizing above minimum threshold
			else if (terminalHeight > 1 && terminalPanelCollapsed) {
				updateUIPreferences({ terminalPanelCollapsed: false });
			}
		}
	};

	const handleRightPanelResize = (sizes: number[]) => {
		if (sizes.length >= 2 && sizes[1] !== undefined) {
			const terminalWidth = sizes[1];
			setPanelSize(terminalWidth);

			// Auto-collapse when resized to very small size
			if (terminalWidth <= 1) {
				updateUIPreferences({ terminalPanelCollapsed: true });
			}
			// Ensure panel is shown when resizing above minimum threshold
			else if (terminalWidth > 1 && terminalPanelCollapsed) {
				updateUIPreferences({ terminalPanelCollapsed: false });
			}
		}
	};

	const shouldShowTerminal = !terminalPanelCollapsed;

	// Bottom position layout (terminal at bottom)
	if (terminalPosition === 'bottom') {
		return (
			<div className="flex-1 flex flex-col overflow-hidden relative">
				{/* ViewPanel - Fixed full size background with higher z-index */}
				<ViewPanel className="h-full w-full absolute inset-0 z-0" />

				{/* Terminal Panel - Resizable overlay from bottom */}
				{shouldShowTerminal && (
					<div className="absolute bottom-0 left-0 right-0 z-10 h-full pointer-events-none">
						<ResizablePanelGroup
							direction="vertical"
							onLayout={handleBottomPanelResize}
							className="h-full pointer-events-none"
						>
							{/* Spacer panel - invisible area above terminal, allows ViewPanel interaction */}
							<ResizablePanel
								defaultSize={100 - resizablePanelSize}
								minSize={0}
								maxSize={95}
								className="pointer-events-none"
							/>

							<ResizableHandle className="bg-[#2d2d30] hover:bg-[#007acc] transition-colors duration-150 h-1 pointer-events-auto z-20" />

							{/* Terminal Panel */}
							<ResizablePanel
								defaultSize={resizablePanelSize}
								minSize={5}
								maxSize={100}
								className="overflow-hidden pointer-events-auto z-20"
							>
								<TerminalPanel />
							</ResizablePanel>
						</ResizablePanelGroup>
					</div>
				)}

				{/* Show Terminal Button */}
				{!shouldShowTerminal && (
					<div className="absolute bottom-4 right-4 z-20">
						<Button
							onClick={showTerminalPanel}
							className="bg-[#1e1e1e] hover:bg-[#2d2d30] text-[#cccccc] border border-[#3e3e42] rounded shadow-lg"
							size="sm"
						>
							<ChevronUpIcon size={14} className="mr-1" />
							Terminal
						</Button>
					</div>
				)}
			</div>
		);
	}

	// Right position layout (terminal at right side)
	return (
		<div className="flex-1 flex flex-col overflow-hidden relative">
			<ResizablePanelGroup
				direction="horizontal"
				onLayout={handleRightPanelResize}
				className="flex-1"
			>
				{/* ViewPanel - Main content area with fixed positioning */}
				<ResizablePanel
					defaultSize={shouldShowTerminal ? 100 - resizablePanelSize : 100}
					minSize={0}
					maxSize={97}
					className="flex flex-col relative"
				>
					<ViewPanel className="h-full w-full absolute inset-0" />
				</ResizablePanel>

				{/* Terminal Panel - Right side */}
				{shouldShowTerminal && (
					<>
						<ResizableHandle
							withHandle
							className="bg-[#2d2d30] hover:bg-[#007acc] transition-colors duration-150 w-1 pointer-events-auto"
						/>
						<ResizablePanel
							defaultSize={resizablePanelSize}
							minSize={3}
							maxSize={100}
							className="overflow-hidden"
						>
							<TerminalPanel />
						</ResizablePanel>
					</>
				)}
			</ResizablePanelGroup>

			{/* Show Terminal Button */}
			{!shouldShowTerminal && (
				<div className="absolute bottom-4 right-4 z-20">
					<Button
						onClick={showTerminalPanel}
						className="bg-[#1e1e1e] hover:bg-[#2d2d30] text-[#cccccc] border border-[#3e3e42] rounded shadow-lg"
						size="sm"
					>
						<SidebarIcon size={14} className="mr-1" />
						Terminal
					</Button>
				</div>
			)}
		</div>
	);
}

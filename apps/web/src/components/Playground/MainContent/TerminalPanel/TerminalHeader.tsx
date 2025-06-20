import React, { memo } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import {
	ChevronUpIcon,
	ChevronDownIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	XIcon,
	PanelBottomIcon,
	SidebarIcon,
} from 'lucide-react';
import { TerminalState } from './types';
import { tabs } from './tabsConfig';
import { useTerminalControls } from './hooks/useTerminalControls';

interface TerminalHeaderProps extends TerminalState {}

export const TerminalHeader: React.FC<TerminalHeaderProps> = memo(({ state }) => {
	const {
		isRight,
		toggleCollapse,
		maximizePanel,
		togglePosition,
		getMaximizeState,
		getPositionTitle,
	} = useTerminalControls();

	const maximizeState = getMaximizeState();
	const positionTitle = getPositionTitle();

	// Helper to get position icon
	const getPositionIcon = () => {
		return isRight ? <PanelBottomIcon size={8} /> : <SidebarIcon size={12} />;
	};

	// Helper to get maximize icon based on current state
	const getMaximizeIcon = () => {
		if (isRight) {
			// Right position: ChevronLeft = maximize, ChevronRight = restore
			return maximizeState.isMaximized ? (
				<ChevronRightIcon size={8} />
			) : (
				<ChevronLeftIcon size={8} />
			);
		} else {
			// Bottom position: ChevronUp = maximize, ChevronDown = restore
			return maximizeState.isMaximized ? (
				<ChevronDownIcon size={12} />
			) : (
				<ChevronUpIcon size={12} />
			);
		}
	};

	// Right position: Vertical layout (Header as sidebar)
	if (isRight) {
		return (
			<div className="w-auto bg-muted/30 border-r border-border flex flex-col">
				{/* Terminal Controls in vertical layout */}
				<div className="flex flex-col gap-1 border-t border-border justify-start items-center h-full">
					<Button variant="ghost" size="icon" onClick={togglePosition} title={positionTitle}>
						{getPositionIcon()}
					</Button>
					<Button variant="ghost" size="icon" onClick={maximizePanel} title={maximizeState.title}>
						{getMaximizeIcon()}
					</Button>
					<Button variant="ghost" size="icon" onClick={toggleCollapse} title="Close Panel">
						<XIcon size={8} />
					</Button>
				</div>

				{/* Tabs in vertical layout */}
				<div className="flex flex-col gap-1 border-t border-border justify-end items-center">
					<TabsList className="bg-transparent p-0 flex-col h-auto gap-0">
						{tabs.map((tab) => {
							const count = tab.counter(state);
							return (
								<TabsTrigger
									key={tab.value}
									value={tab.value}
									className="text-xs px-2 py-3 w-full bg-transparent data-[state=active]:bg-[#2d2d30] data-[state=active]:text-white text-[#cccccc] border-none rounded-none flex flex-col items-center gap-1 min-h-[60px]"
								>
									<tab.icon size={8} />
									{count > 0 && (
										<Badge variant={tab.badge} className="text-[8px] h-3 px-1 leading-none">
											{count}
										</Badge>
									)}
								</TabsTrigger>
							);
						})}
					</TabsList>
				</div>
			</div>
		);
	}

	// Bottom position: Horizontal layout (Header as top bar)
	return (
		<div className="h-8 bg-muted/30 border-b border-border flex items-center justify-between px-2">
			<div className="flex items-center">
				<TabsList className="bg-transparent p-0 flex-row">
					{tabs.map((tab) => {
						const count = tab.counter(state);
						return (
							<TabsTrigger
								key={tab.value}
								value={tab.value}
								className="text-xs px-2 h-6 bg-transparent data-[state=active]:bg-[#2d2d30] data-[state=active]:text-white text-[#cccccc] border-none rounded-none"
							>
								<tab.icon size={12} className="mr-1" />
								{tab.label}
								{count > 0 && (
									<Badge variant={tab.badge} className="ml-1 text-xs h-4 px-1">
										{count}
									</Badge>
								)}
							</TabsTrigger>
						);
					})}
				</TabsList>
			</div>

			{/* Terminal Controls */}
			<div className="flex items-center gap-1">
				<Button
					variant="ghost"
					size="sm"
					onClick={togglePosition}
					className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#2d2d30] rounded-none"
					title={positionTitle}
				>
					{getPositionIcon()}
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={maximizePanel}
					className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#2d2d30] rounded-none"
					title={maximizeState.title}
				>
					{getMaximizeIcon()}
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={toggleCollapse}
					className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#2d2d30] hover:text-white rounded-none"
					title="Close Panel"
				>
					<XIcon size={12} />
				</Button>
			</div>
		</div>
	);
});

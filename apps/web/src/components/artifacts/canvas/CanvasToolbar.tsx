'use client';

import React from 'react';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Separator } from '@workspace/ui/components/separator';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from '@workspace/ui/components/dropdown-menu';
import {
	PlayIcon,
	PauseIcon,
	XIcon,
	MonitorIcon,
	LayoutGridIcon,
	SidebarIcon,
	SplitIcon,
	ExpandIcon,
	ShrinkIcon,
	DownloadIcon,
	SettingsIcon,
	EyeIcon,
	EyeOffIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';

export interface CanvasToolbarProps {
	canvasState: 'empty' | 'executing' | 'issues-detected' | 'completed';
	isRunning: boolean;
	showStream: boolean;
	streamExpanded: boolean;
	streamUrl?: string;
	simulation?: { isDone?: boolean; usabilityIssues?: any[] };
	onStart?: () => void;
	onStop?: () => void;
	onPause?: () => void;
	onToggleStream: () => void;
	onToggleStreamExpand: () => void;
	onExport: () => void;
	onLayoutChange: (layout: 'split' | 'stacked') => void;
	currentLayout: 'split' | 'stacked';
	controlsCollapsed?: boolean;
	onToggleControls?: (collapsed: boolean) => void;
}

export function CanvasToolbar({
	canvasState,
	isRunning,
	showStream,
	streamExpanded,
	streamUrl,
	simulation,
	onStart,
	onStop,
	onToggleStream,
	onToggleStreamExpand,
	onExport,
	onLayoutChange,
	currentLayout,
	controlsCollapsed = false,
	onToggleControls,
}: CanvasToolbarProps) {
	const shouldShowIssues = simulation?.isDone && simulation?.usabilityIssues?.length;
	const getStateColor = () => {
		switch (canvasState) {
			case 'executing':
				return 'bg-blue-500/10 text-blue-700 border-blue-200';
			case 'issues-detected':
				return 'bg-orange-500/10 text-orange-700 border-orange-200';
			case 'completed':
				return 'bg-green-500/10 text-green-700 border-green-200';
			default:
				return 'bg-gray-500/10 text-gray-700 border-gray-200';
		}
	};

	const getStateLabel = () => {
		switch (canvasState) {
			case 'executing':
				return 'Executing Actions';
			case 'issues-detected':
				return 'Issues Detected';
			case 'completed':
				return 'Simulation Complete';
			default:
				return 'Ready';
		}
	};

	const getLayoutIcon = () => {
		switch (currentLayout) {
			case 'split':
				return <SplitIcon size={14} />;
			case 'stacked':
				return <LayoutGridIcon size={14} />;
			default:
				return <SplitIcon size={14} />;
		}
	};

	return (
		<div className="h-10 border-b bg-background/50 backdrop-blur-sm flex items-center justify-between px-4">
			{/* Left: Controls */}
			<div className="flex items-center gap-2">
				{/* Controls Toggle */}
				{onToggleControls && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onToggleControls(!controlsCollapsed)}
						className="h-7 w-7 p-0"
						title={controlsCollapsed ? 'Show Controls' : 'Hide Controls'}
					>
						<SidebarIcon size={12} />
					</Button>
				)}

				{!isRunning ? (
					<Button variant="ghost" size="sm" onClick={onStart} className="h-7 px-2 text-xs">
						<PlayIcon size={12} className="mr-1" />
						Run
					</Button>
				) : (
					<Button
						variant="ghost"
						size="sm"
						onClick={onStop}
						className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
					>
						<XIcon size={12} className="mr-1" />
						Stop
					</Button>
				)}

				{/* State Indicator */}
				{isRunning && (
					<div className="flex items-center gap-1 text-xs text-muted-foreground">
						<div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
						Running
					</div>
				)}
			</div>

			{/* Right: Minimal Controls */}
			<div className="flex items-center gap-1">
				{/* Stream Toggle */}
				{streamUrl && (
					<Button
						variant="ghost"
						size="sm"
						onClick={onToggleStream}
						className="h-7 w-7 p-0"
						title="Toggle Stream"
					>
						{showStream ? <EyeIcon size={12} /> : <EyeOffIcon size={12} />}
					</Button>
				)}

				{/* Layout Selector - Only when issues are shown */}
				{shouldShowIssues && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onLayoutChange(currentLayout === 'split' ? 'stacked' : 'split')}
						className="h-7 w-7 p-0"
						title={
							currentLayout === 'split'
								? 'Switch to stacked layout'
								: 'Switch to side-by-side layout'
						}
					>
						{getLayoutIcon()}
					</Button>
				)}

				{/* Export */}
				{canvasState !== 'empty' && (
					<Button
						variant="ghost"
						size="sm"
						onClick={onExport}
						className="h-7 w-7 p-0"
						title="Export"
					>
						<DownloadIcon size={12} />
					</Button>
				)}
			</div>
		</div>
	);
}

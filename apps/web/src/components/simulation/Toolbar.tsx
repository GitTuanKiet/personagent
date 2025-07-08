'use client';

import React from 'react';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import {
	PlayIcon,
	XIcon,
	MonitorIcon,
	DownloadIcon,
	EyeIcon,
	EyeOffIcon,
	ChevronLeftIcon,
} from 'lucide-react';
import { ThreadState } from '@/types';
import { ApplicationSelect } from '@/components/application-select';

export interface SimulationToolbarProps {
	canvasState: 'empty' | 'executing' | 'issues-detected' | 'completed';
	isRunning: boolean;
	showStream: boolean;
	streamExpanded: boolean;
	streamUrl?: string;
	isDone: boolean;
	usabilityIssues: ThreadState['usabilityIssues'];
	onStart?: () => void;
	onStop?: () => void;
	onPause?: () => void;
	onToggleStream: () => void;
	onToggleStreamExpand: () => void;
	onExport: () => void;
	setChatCollapsed: (c: boolean) => void;
}

export function SimulationToolbar({
	canvasState,
	isRunning,
	showStream,
	streamExpanded,
	streamUrl,
	isDone,
	usabilityIssues,
	onStart,
	onStop,
	onPause,
	onToggleStream,
	onToggleStreamExpand,
	onExport,
	setChatCollapsed,
}: SimulationToolbarProps) {
	const shouldShowIssues = isDone && usabilityIssues?.length > 0;

	return (
		<div className="h-10 border-b bg-background/50 backdrop-blur-sm flex items-center justify-between px-4">
			{/* Left: Controls */}
			<div className="flex items-center gap-2">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setChatCollapsed(false)}
					className="h-7 px-2 text-xs"
				>
					<ChevronLeftIcon size={12} />
				</Button>
				{/* Application Select */}
				<ApplicationSelect />

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

				{canvasState !== 'empty' && (
					<Button
						variant="ghost"
						size="sm"
						onClick={onExport}
						className="h-7 w-7 p-0"
						title="Export JSON"
					>
						<DownloadIcon size={12} />
					</Button>
				)}
			</div>
		</div>
	);
}

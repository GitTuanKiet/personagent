'use client';

import React, { useState, useEffect } from 'react';
import { BrowserToolCall, Simulation } from '@/types';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { Separator } from '@workspace/ui/components/separator';
import {
	AlertTriangleIcon,
	CheckCircleIcon,
	PlayIcon,
	PauseIcon,
	XIcon,
	MonitorIcon,
	EyeIcon,
	ZapIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	ExpandIcon,
	ShrinkIcon,
	DownloadIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@workspace/ui/lib/utils';
import { ActionCanvas } from './canvas';
import { IssuesPanel } from './canvas';
import { StreamView } from './canvas';
import { CanvasToolbar } from './canvas';
import { BaseMessage } from '@langchain/core/messages';

export interface CanvasArtifactRendererProps {
	messages?: BaseMessage[];
	simulation?: Simulation;
	actions?: BrowserToolCall[];
	isRunning?: boolean;
	streamUrl?: string;
	layout?: 'split' | 'stacked';
	onStart?: () => void;
	onStop?: () => void;
	onPause?: () => void;
	onLayoutChange?: (layout: 'split' | 'stacked') => void;
	controlsCollapsed?: boolean;
	onToggleControls?: (collapsed: boolean) => void;
	className?: string;
}

export function ArtifactRenderer({
	messages,
	simulation,
	actions = [],
	isRunning = false,
	streamUrl,
	layout: externalCanvasLayout,
	onStart,
	onStop,
	onPause,
	onLayoutChange,
	controlsCollapsed = false,
	onToggleControls,
	className = '',
}: CanvasArtifactRendererProps) {
	const [showStream, setShowStream] = useState(false);
	const [streamExpanded, setStreamExpanded] = useState(false);
	const [internalCanvasLayout, setInternalCanvasLayout] = useState<'split' | 'stacked'>('split');

	// Use external layout if provided, otherwise use internal
	const layout = externalCanvasLayout || internalCanvasLayout;

	const hasIssues = Boolean(simulation?.usabilityIssues?.length);
	const isDone = simulation?.isDone;
	const shouldShowIssues = isDone && hasIssues; // Issues only show when simulation is done

	// Handle layout changes
	const handleLayoutChange = (newLayout: 'split' | 'stacked') => {
		if (onLayoutChange) {
			onLayoutChange(newLayout);
		} else {
			setInternalCanvasLayout(newLayout);
		}
	};

	// Auto-set layout when issues are available after completion
	useEffect(() => {
		if (shouldShowIssues && !externalCanvasLayout) {
			setInternalCanvasLayout('split'); // Default to split (70/30) layout
		}
	}, [shouldShowIssues, externalCanvasLayout]);

	const getCanvasState = () => {
		if (!simulation) return 'empty';
		if (isRunning || !isDone) return 'executing';
		if (isDone && hasIssues) return 'issues-detected';
		if (isDone) return 'completed';
		return 'executing';
	};

	const canvasState = getCanvasState();

	const handleExport = () => {
		if (!simulation) return;

		const exportData = {
			simulation,
			actions,
			timestamp: new Date().toISOString(),
			canvasState,
		};

		const blob = new Blob([JSON.stringify(exportData, null, 2)], {
			type: 'application/json',
		});

		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `simulation-canvas-${Date.now()}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	return (
		<div className={cn('flex flex-col h-full bg-background', className)}>
			{/* Canvas Toolbar */}
			<CanvasToolbar
				canvasState={canvasState}
				isRunning={isRunning}
				showStream={showStream}
				streamExpanded={streamExpanded}
				streamUrl={streamUrl}
				simulation={simulation}
				onStart={onStart}
				onStop={onStop}
				onToggleStream={() => setShowStream(!showStream)}
				onToggleStreamExpand={() => setStreamExpanded(!streamExpanded)}
				onExport={handleExport}
				onLayoutChange={handleLayoutChange}
				currentLayout={layout}
				controlsCollapsed={controlsCollapsed}
				onToggleControls={onToggleControls}
			/>

			{/* Main Canvas Area */}
			<div className="flex-1 flex flex-col overflow-hidden">
				{/* Stream View (when enabled) - Vertical */}
				<AnimatePresence>
					{showStream && (
						<motion.div
							initial={{ height: 0, opacity: 0 }}
							animate={{
								height: streamExpanded ? '60%' : '40%',
								opacity: 1,
							}}
							exit={{ height: 0, opacity: 0 }}
							transition={{ duration: 0.3 }}
							className="border-b bg-muted/20"
						>
							<StreamView
								streamUrl={streamUrl}
								isConnected={isRunning}
								expanded={streamExpanded}
								onToggleExpand={() => setStreamExpanded(!streamExpanded)}
							/>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Main Content Canvas */}
				{shouldShowIssues ? (
					// Show issues panel (only when simulation is done)
					layout === 'split' ? (
						// Split layout: 70% Actions | 30% Issues (horizontal)
						<div className="flex-1 flex overflow-hidden">
							<div className="flex-1 min-w-0 overflow-hidden" style={{ flexBasis: '70%' }}>
								<ActionCanvas
									simulation={simulation}
									actions={actions}
									canvasState={canvasState}
									isCompact={false}
								/>
							</div>
							<div
								className="border-l flex-shrink-0 overflow-hidden"
								style={{ flexBasis: '30%', minWidth: '280px', maxWidth: '400px' }}
							>
								<IssuesPanel
									issues={simulation?.usabilityIssues || []}
									isExpanded={true}
									onToggleExpand={() => handleLayoutChange('stacked')}
								/>
							</div>
						</div>
					) : (
						// Stacked layout: Actions top, Issues bottom (vertical)
						<div className="flex-1 flex flex-col overflow-hidden">
							<div className="flex-1 min-h-0 border-b">
								<ActionCanvas
									simulation={simulation}
									actions={actions}
									canvasState={canvasState}
									isCompact={true}
								/>
							</div>
							<div className="h-80 min-h-0 flex-shrink-0">
								<IssuesPanel
									issues={simulation?.usabilityIssues || []}
									isExpanded={true}
									onToggleExpand={() => handleLayoutChange('split')}
								/>
							</div>
						</div>
					)
				) : (
					// Full width: Actions only (when running or no issues)
					<div className="flex-1 overflow-hidden">
						<ActionCanvas
							simulation={simulation}
							actions={actions}
							canvasState={canvasState}
							isCompact={false}
						/>
					</div>
				)}
			</div>

			{/* Canvas Status Bar */}
			<div className="h-8 border-t bg-muted/30 flex items-center justify-between px-4 text-xs text-muted-foreground">
				<div className="flex items-center gap-4">
					<span>Canvas: {canvasState}</span>
					{simulation && (
						<>
							<Separator orientation="vertical" className="h-4" />
							<span>
								Actions: {actions.length} | Steps: {simulation.nSteps || 0}
							</span>
						</>
					)}
					{hasIssues && (
						<>
							<Separator orientation="vertical" className="h-4" />
							<span className="text-orange-600">Issues: {simulation?.usabilityIssues?.length}</span>
						</>
					)}
				</div>

				<div className="flex items-center gap-2">
					{streamUrl && (
						<Badge variant="outline" className="h-5 text-xs">
							Stream Ready
						</Badge>
					)}
					<Badge variant="outline" className="h-5 text-xs">
						Layout: {layout}
					</Badge>
				</div>
			</div>
		</div>
	);
}

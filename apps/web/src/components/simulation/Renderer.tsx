'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { BrowserToolCall, ThreadState } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@workspace/ui/lib/utils';

import { ActionRenderer } from './Action';
import { SimulationToolbar } from './Toolbar';
import { StreamView } from './StreamView';
import { IssuesPanel } from './IssuePanel';
import { exportSimulationData } from './utils';

export interface SimulationRendererProps {
	state: ThreadState;
	isRunning?: boolean;
	onStart?: () => void;
	onStop?: () => void;
	onPause?: () => void;
	className?: string;
	setChatCollapsed?: (c: boolean) => void;
}

export function SimulationRenderer({
	state,
	isRunning = false,
	onStart,
	onStop,
	onPause,
	className = '',
	setChatCollapsed,
}: SimulationRendererProps) {
	const [showStream, setShowStream] = useState(false);
	const [streamExpanded, setStreamExpanded] = useState(false);
	const [layout, setLayout] = useState<'split' | 'stacked'>('split');

	// No playback control

	const hasIssues = Boolean(state.usabilityIssues?.length);
	const shouldShowIssues = state.isDone && hasIssues;

	// Auto-open StreamView when streamUrl is received
	// Skip opening if usability issues are already detected to avoid toggle loops
	useEffect(() => {
		if (state.streamUrl && !showStream && !shouldShowIssues) {
			setShowStream(true);
			setStreamExpanded(true);
		}
	}, [state.streamUrl, showStream, shouldShowIssues]);

	useEffect(() => {
		if (shouldShowIssues && showStream) {
			setShowStream(false);
		}
	}, [shouldShowIssues, showStream]);

	const getCanvasState = () => {
		if (!state.scripts) return 'empty';
		if (isRunning || !state.isDone) return 'executing';
		if (state.isDone && hasIssues) return 'issues-detected';
		if (state.isDone) return 'completed';
		return 'executing';
	};

	const canvasState = getCanvasState();

	/**
	 * Export simulation data in specified format
	 */
	const handleExport = () => {
		if (!state.scripts) return;
		exportSimulationData(state.scripts, state.usabilityIssues);
	};

	const handleLayoutChange = (newLayout: 'split' | 'stacked') => {
		setLayout(newLayout);
	};

	// Choose actions to display: when StreamView is shown, display currently executing actions (state.actions)
	// Otherwise, display the full recorded scripts (state.scripts)
	const currentScripts = useMemo((): Record<number, BrowserToolCall[]> => {
		if (showStream) {
			return {
				1: state.actions || [],
			};
		}
		return state.scripts || {};
	}, [showStream, state.actions, state.scripts]);

	return (
		<div className={cn('flex flex-col h-full bg-background', className)}>
			{/* Canvas Toolbar */}
			<SimulationToolbar
				canvasState={canvasState}
				isRunning={isRunning}
				showStream={showStream}
				streamExpanded={streamExpanded}
				streamUrl={state.streamUrl}
				isDone={state.isDone}
				usabilityIssues={state.usabilityIssues}
				onStart={onStart}
				onStop={onStop}
				onToggleStream={() => setShowStream(!showStream)}
				onToggleStreamExpand={() => setStreamExpanded(!streamExpanded)}
				onExport={handleExport}
				setChatCollapsed={setChatCollapsed}
			/>

			{/* Main Canvas Area */}
			<div className="flex-1 flex flex-col min-h-0 overflow-hidden">
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
							className="flex-shrink-0 border-b bg-muted/20"
						>
							<StreamView
								streamUrl={state.streamUrl}
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
							<div className="flex-1 min-w-0 min-h-0 overflow-hidden" style={{ flexBasis: '70%' }}>
								<ActionRenderer
									scripts={currentScripts}
									canvasState={canvasState}
									isCompact={false}
								/>
							</div>
							<div
								className="border-l flex-shrink-0 overflow-hidden"
								style={{ flexBasis: '30%', minWidth: '280px', maxWidth: '400px' }}
							>
								<IssuesPanel
									issues={state.usabilityIssues || []}
									isExpanded={true}
									onToggleExpand={() => handleLayoutChange('stacked')}
									layout={layout}
								/>
							</div>
						</div>
					) : (
						// Stacked layout: Actions top, Issues bottom (vertical)
						<div className="flex-1 flex flex-col overflow-hidden">
							<div className="flex-1 min-h-0 overflow-hidden border-b">
								<ActionRenderer
									scripts={currentScripts}
									canvasState={canvasState}
									isCompact={true}
								/>
							</div>
							<div className="h-80 min-h-0 flex-shrink-0">
								<IssuesPanel
									issues={state.usabilityIssues || []}
									isExpanded={true}
									onToggleExpand={() => handleLayoutChange('split')}
									layout={layout}
								/>
							</div>
						</div>
					)
				) : (
					// Full width: Actions only (when running or no issues)
					<div className="flex-1 min-h-0 overflow-hidden">
						<ActionRenderer scripts={currentScripts} canvasState={canvasState} isCompact={false} />
					</div>
				)}
			</div>
		</div>
	);
}

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ThreadState } from '@/types';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { Button } from '@workspace/ui/components/button';
import { ZapIcon, ChevronDownIcon, ChevronUpIcon, MinusIcon, PlusIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@workspace/ui/lib/utils';
import { ActionCard } from './Card';
import { getActionConfig } from './utils';

export interface ActionRendererProps {
	scripts?: ThreadState['scripts'];
	canvasState: 'empty' | 'executing' | 'issues-detected' | 'completed';
	isCompact?: boolean;
	selectedActionIndex?: number;
	onActionSelect?: (index: number) => void;
}

export function ActionRenderer({
	scripts,
	canvasState,
	isCompact = false,
	selectedActionIndex,
	onActionSelect,
}: ActionRendererProps) {
	const [selectedAction, setSelectedAction] = useState<number | null>(null);
	const [internalSelected, setInternalSelected] = useState<number | null>(null);
	// Determine selected action: external (playback) or internal
	const selected = selectedActionIndex !== undefined ? selectedActionIndex : internalSelected;
	const scrollAreaRef = useRef<HTMLDivElement>(null);
	// Scroll to selected action when it changes
	useEffect(() => {
		if (selected !== null && scrollAreaRef.current) {
			const el = scrollAreaRef.current.querySelector(
				`[data-action-index="${selected}"]`,
			) as HTMLElement | null;
			if (el) {
				el.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
		}
	}, [selected]);
	const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
	const [allStepsExpanded, setAllStepsExpanded] = useState(true);
	const allSteps = new Set(
		Object.keys(scripts || {})
			.map((step) => parseInt(step))
			.filter((step) => !isNaN(step)),
	);
	const actionCount = Object.values(scripts || {}).reduce(
		(total, step) => total + (step.length || 0),
		0,
	);

	useEffect(() => {
		if (canvasState !== 'executing' || !scrollAreaRef.current) {
			return;
		}
		const scrollContainer = scrollAreaRef.current.querySelector(
			'[data-radix-scroll-area-viewport]',
		) as HTMLElement | null;
		if (!scrollContainer) {
			return;
		}

		// schedule the scroll update for the next frame
		const raf = requestAnimationFrame(() => {
			// Only adjust if we're not already at the bottom to avoid unnecessary work
			if (
				scrollContainer.scrollTop + scrollContainer.clientHeight <
				scrollContainer.scrollHeight - 1 // allow tiny rounding difference
			) {
				scrollContainer.scrollTop = scrollContainer.scrollHeight;
			}
		});

		return () => cancelAnimationFrame(raf);
	}, [scripts, canvasState]);

	const getStepActions = (step: number) => {
		return scripts[step] || [];
	};

	const renderEmptyState = () => (
		<div className="flex flex-col items-center justify-center h-full max-h-full text-center p-8 overflow-hidden">
			<div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
				<ZapIcon size={24} className="text-muted-foreground" />
			</div>
			<h3 className="text-lg font-semibold mb-2">Ready to Simulate</h3>
			<p className="text-muted-foreground max-w-md">
				Start a simulation to see browser actions executed in real-time. Actions will appear here as
				they're performed.
			</p>
		</div>
	);

	const scriptsRef = useRef<string>('');

	useEffect(() => {
		if (scripts && Object.keys(scripts).length > 0) {
			const steps = new Set(
				Object.keys(scripts)
					.map((step) => parseInt(step))
					.filter((step) => !isNaN(step)),
			);
			const newStepsString = Array.from(steps).sort().join(',');

			// Only update if steps actually changed to prevent unnecessary re-renders
			if (scriptsRef.current !== newStepsString) {
				scriptsRef.current = newStepsString;
				setExpandedSteps(steps);
				setAllStepsExpanded(true);
			}
		}
	}, [scripts]);

	const toggleStep = (stepNumber: number) => {
		const newExpandedSteps = new Set(expandedSteps);
		if (newExpandedSteps.has(stepNumber)) {
			newExpandedSteps.delete(stepNumber);
		} else {
			newExpandedSteps.add(stepNumber);
		}
		setExpandedSteps(newExpandedSteps);
		setAllStepsExpanded(newExpandedSteps.size === allSteps.size);
	};

	const toggleAllSteps = () => {
		if (allStepsExpanded) {
			// Collapse all
			setExpandedSteps(new Set());
			setAllStepsExpanded(false);
		} else {
			// Expand all
			setExpandedSteps(new Set(allSteps));
			setAllStepsExpanded(true);
		}
	};

	const renderTimelineView = () => {
		return (
			<div className="relative">
				{/* Timeline Line */}
				<div className="absolute left-8 top-0 bottom-0 w-px bg-border" />

				<div className="space-y-6 p-6">
					{/* Collapse/Expand All Controls */}
					{allSteps.size > 1 && (
						<div className="flex items-center justify-between mb-4 pb-2 border-b">
							<div className="flex items-center gap-2">
								<span className="text-sm font-medium text-muted-foreground">
									{allSteps.size} Steps • {actionCount} Actions
								</span>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={toggleAllSteps}
								className="h-7 px-2 text-xs"
							>
								{allStepsExpanded ? (
									<>
										<MinusIcon size={12} className="mr-1" />
										Collapse All
									</>
								) : (
									<>
										<PlusIcon size={12} className="mr-1" />
										Expand All
									</>
								)}
							</Button>
						</div>
					)}
					<AnimatePresence>
						{Array.from(allSteps)
							.sort((a, b) => a - b)
							.map((step) => {
								const steps = Array.from(allSteps).sort((a, b) => a - b);
								const actions = getStepActions(step);
								return (
									<motion.div
										key={step}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: step * 0.1 }}
										className="space-y-3"
									>
										{/* Step Header */}
										{allSteps.size > 1 && (
											<div className="flex items-center gap-3 mb-4">
												<div className="relative z-10 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
													{step}
												</div>
												<span className="text-sm font-medium text-muted-foreground">
													Step {step} • {actions.length} actions
												</span>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => toggleStep(step)}
													className="h-6 w-6 p-0 ml-auto"
													title={expandedSteps.has(step) ? 'Collapse step' : 'Expand step'}
												>
													{expandedSteps.has(step) ? (
														<ChevronUpIcon size={12} />
													) : (
														<ChevronDownIcon size={12} />
													)}
												</Button>
											</div>
										)}

										{/* Actions in Step */}
										<AnimatePresence>
											{expandedSteps.has(step) && (
												<motion.div
													initial={{ opacity: 0, height: 0 }}
													animate={{ opacity: 1, height: 'auto' }}
													exit={{ opacity: 0, height: 0 }}
													transition={{ duration: 0.2 }}
													className={cn(
														'space-y-3 overflow-hidden',
														allSteps.size > 1 ? 'ml-8' : 'ml-0',
													)}
												>
													{actions.map((action, actionIndex) => {
														const globalIndex =
															steps
																.slice(0, steps.indexOf(step))
																.reduce((acc, s) => acc + getStepActions(s).length, 0) +
															actionIndex;

														const config = getActionConfig(action.name);
														const IconComp = config.icon;

														return (
															<motion.div
																key={`step-${step}-action-${actionIndex}-${action.name}`}
																data-action-index={globalIndex}
																initial={{ opacity: 0, x: -20 }}
																animate={{ opacity: 1, x: 0 }}
																transition={{ delay: step * 0.1 + actionIndex * 0.05 }}
																className="relative flex items-start gap-4"
															>
																{/* Action Node */}
																<div className="relative z-10 w-6 h-6 bg-background border border-border rounded-full flex items-center justify-center">
																	<IconComp size={16} className={`text-${config.color}-500`} />
																</div>

																{/* Action Card */}
																<div className="flex-1 -mt-1 min-w-0">
																	<ActionCard
																		action={action}
																		index={globalIndex}
																		isSelected={selected === globalIndex}
																		isCompact={isCompact}
																		onClick={() => {
																			if (onActionSelect) {
																				onActionSelect(globalIndex);
																			} else {
																				setInternalSelected(
																					selected === globalIndex ? null : globalIndex,
																				);
																			}
																		}}
																	/>
																</div>
															</motion.div>
														);
													})}
												</motion.div>
											)}
										</AnimatePresence>
									</motion.div>
								);
							})}
					</AnimatePresence>
				</div>
			</div>
		);
	};

	// Show empty state if no simulation or no actions to display
	if (canvasState === 'empty' || actionCount === 0) {
		return renderEmptyState();
	}

	return (
		<div className="flex flex-col h-full max-h-full overflow-hidden">
			{/* Simple Header - Only when needed */}
			{!isCompact && actionCount > 10 && (
				<div className="px-4 py-2 border-b bg-background/50 flex-shrink-0 text-sm text-muted-foreground">
					{actionCount} actions
				</div>
			)}

			{/* Canvas Content */}
			<div className="flex-1 min-h-0 overflow-hidden">
				<ScrollArea className="h-full" ref={scrollAreaRef}>
					{renderTimelineView()}
				</ScrollArea>
			</div>
		</div>
	);
}

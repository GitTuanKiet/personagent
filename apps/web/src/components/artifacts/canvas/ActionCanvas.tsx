'use client';

import React, { useState, useRef, useEffect } from 'react';
import { BrowserToolCall, Simulation } from '@/types';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import {
	MousePointerClickIcon,
	TypeIcon,
	NavigationIcon,
	EyeIcon,
	ClockIcon,
	CheckCircleIcon,
	ActivityIcon,
	RefreshCwIcon,
	ZapIcon,
	ChevronRightIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	MinusIcon,
	PlusIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@workspace/ui/lib/utils';
import { ActionCard } from './ActionCard';

export interface ActionCanvasProps {
	simulation?: Simulation;
	actions?: BrowserToolCall[];
	canvasState: 'empty' | 'executing' | 'issues-detected' | 'completed';
	isCompact?: boolean;
}

export function ActionCanvas({
	simulation,
	actions = [],
	canvasState,
	isCompact = false,
}: ActionCanvasProps) {
	const [selectedAction, setSelectedAction] = useState<number | null>(null);
	const [viewMode, setViewMode] = useState<'timeline' | 'grid' | 'list'>('timeline');
	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const [autoScroll, setAutoScroll] = useState(true);
	const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
	const [allStepsExpanded, setAllStepsExpanded] = useState(true);

	// Auto-scroll to latest action during execution
	useEffect(() => {
		if (autoScroll && canvasState === 'executing' && scrollAreaRef.current) {
			const scrollContainer = scrollAreaRef.current.querySelector(
				'[data-radix-scroll-area-viewport]',
			);
			if (scrollContainer) {
				scrollContainer.scrollTop = scrollContainer.scrollHeight;
			}
		}
	}, [actions.length, autoScroll, canvasState]);

	const getActionIcon = (actionName: string) => {
		switch (actionName.toLowerCase()) {
			case 'click':
			case 'click_element_by_index':
				return <MousePointerClickIcon size={16} className="text-blue-500" />;
			case 'type':
			case 'fill':
			case 'fill_form':
				return <TypeIcon size={16} className="text-green-500" />;
			case 'navigate':
			case 'navigate_to_url':
				return <NavigationIcon size={16} className="text-purple-500" />;
			case 'screenshot':
			case 'take_screenshot':
				return <EyeIcon size={16} className="text-cyan-500" />;
			case 'wait':
				return <ClockIcon size={16} className="text-yellow-500" />;
			case 'done':
				return <CheckCircleIcon size={16} className="text-green-600" />;
			case 'scroll':
				return <RefreshCwIcon size={16} className="text-orange-500" />;
			default:
				return <ActivityIcon size={16} className="text-gray-500" />;
		}
	};

	const renderEmptyState = () => (
		<div className="flex flex-col items-center justify-center h-full text-center p-8">
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

	// Group actions by steps
	const getActionsBySteps = () => {
		if (!simulation?.scripts || Object.keys(simulation.scripts).length === 0) {
			// If no scripts, group all actions into one step
			return [{ stepNumber: 1, actions: actions }];
		}

		// Convert scripts object to step groups
		return Object.entries(simulation.scripts)
			.sort(([a], [b]) => parseInt(a) - parseInt(b))
			.map(([stepKey, stepActions]) => ({
				stepNumber: parseInt(stepKey) + 1,
				actions: stepActions || [],
			}))
			.filter((step) => step.actions.length > 0);
	};

	// Initialize expanded steps on first load
	const stepGroups = getActionsBySteps();
	React.useEffect(() => {
		if (stepGroups.length > 0 && expandedSteps.size === 0) {
			// Initially expand all steps
			const allSteps = new Set(stepGroups.map((step) => step.stepNumber));
			setExpandedSteps(allSteps);
		}
	}, [stepGroups.length]);

	// Step collapse/expand handlers
	const toggleStep = (stepNumber: number) => {
		const newExpandedSteps = new Set(expandedSteps);
		if (newExpandedSteps.has(stepNumber)) {
			newExpandedSteps.delete(stepNumber);
		} else {
			newExpandedSteps.add(stepNumber);
		}
		setExpandedSteps(newExpandedSteps);
		setAllStepsExpanded(newExpandedSteps.size === stepGroups.length);
	};

	const toggleAllSteps = () => {
		if (allStepsExpanded) {
			// Collapse all
			setExpandedSteps(new Set());
			setAllStepsExpanded(false);
		} else {
			// Expand all
			const allSteps = new Set(stepGroups.map((step) => step.stepNumber));
			setExpandedSteps(allSteps);
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
					{stepGroups.length > 1 && (
						<div className="flex items-center justify-between mb-4 pb-2 border-b">
							<div className="flex items-center gap-2">
								<span className="text-sm font-medium text-muted-foreground">
									{stepGroups.length} Steps • {actions.length} Actions
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
						{stepGroups.map((step, stepIndex) => (
							<motion.div
								key={stepIndex}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: stepIndex * 0.1 }}
								className="space-y-3"
							>
								{/* Step Header */}
								{stepGroups.length > 1 && (
									<div className="flex items-center gap-3 mb-4">
										<div className="relative z-10 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
											{step.stepNumber}
										</div>
										<span className="text-sm font-medium text-muted-foreground">
											Step {step.stepNumber} • {step.actions.length} actions
										</span>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => toggleStep(step.stepNumber)}
											className="h-6 w-6 p-0 ml-auto"
											title={expandedSteps.has(step.stepNumber) ? 'Collapse step' : 'Expand step'}
										>
											{expandedSteps.has(step.stepNumber) ? (
												<ChevronUpIcon size={12} />
											) : (
												<ChevronDownIcon size={12} />
											)}
										</Button>
									</div>
								)}

								{/* Actions in Step */}
								<AnimatePresence>
									{expandedSteps.has(step.stepNumber) && (
										<motion.div
											initial={{ opacity: 0, height: 0 }}
											animate={{ opacity: 1, height: 'auto' }}
											exit={{ opacity: 0, height: 0 }}
											transition={{ duration: 0.2 }}
											className={cn(
												'space-y-3 overflow-hidden',
												stepGroups.length > 1 ? 'ml-8' : 'ml-0',
											)}
										>
											{step.actions.map((action, actionIndex) => {
												const globalIndex =
													stepGroups
														.slice(0, stepIndex)
														.reduce((acc, s) => acc + s.actions.length, 0) + actionIndex;

												return (
													<motion.div
														key={`${stepIndex}-${actionIndex}`}
														initial={{ opacity: 0, x: -20 }}
														animate={{ opacity: 1, x: 0 }}
														transition={{ delay: stepIndex * 0.1 + actionIndex * 0.05 }}
														className="relative flex items-start gap-4"
													>
														{/* Action Node */}
														<div className="relative z-10 w-6 h-6 bg-background border border-border rounded-full flex items-center justify-center">
															{getActionIcon(action.name)}
														</div>

														{/* Action Card */}
														<div className="flex-1 -mt-1">
															<ActionCard
																action={action}
																index={globalIndex}
																isSelected={selectedAction === globalIndex}
																isCompact={isCompact}
																onClick={() =>
																	setSelectedAction(
																		selectedAction === globalIndex ? null : globalIndex,
																	)
																}
															/>
														</div>
													</motion.div>
												);
											})}
										</motion.div>
									)}
								</AnimatePresence>
							</motion.div>
						))}
					</AnimatePresence>

					{/* Execution Indicator */}
					{canvasState === 'executing' && (
						<motion.div
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							className="relative flex items-center gap-4 ml-8"
						>
							<div className="relative z-10 w-6 h-6 bg-blue-500 border-2 border-blue-300 rounded-full flex items-center justify-center animate-pulse">
								<div className="w-2 h-2 bg-white rounded-full" />
							</div>
							<div className="flex-1 p-2 border border-blue-200 rounded-md bg-blue-50 dark:bg-blue-950/20">
								<div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
									<ActivityIcon size={12} />
									<span className="text-xs font-medium">Executing...</span>
								</div>
							</div>
						</motion.div>
					)}
				</div>
			</div>
		);
	};

	const renderGridView = () => (
		<div
			className={cn(
				'grid gap-4 p-6',
				isCompact ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
			)}
		>
			<AnimatePresence>
				{actions.map((action, index) => (
					<motion.div
						key={index}
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: index * 0.03 }}
					>
						<ActionCard
							action={action}
							index={index}
							isSelected={selectedAction === index}
							isCompact={isCompact}
							variant="grid"
							onClick={() => setSelectedAction(selectedAction === index ? null : index)}
						/>
					</motion.div>
				))}
			</AnimatePresence>
		</div>
	);

	const renderListView = () => {
		return (
			<div className="space-y-4 p-6">
				{/* Collapse/Expand All Controls */}
				{stepGroups.length > 1 && (
					<div className="flex items-center justify-between mb-4 pb-2 border-b">
						<div className="flex items-center gap-2">
							<span className="text-sm font-medium text-muted-foreground">
								{stepGroups.length} Steps • {actions.length} Actions
							</span>
						</div>
						<Button variant="ghost" size="sm" onClick={toggleAllSteps} className="h-7 px-2 text-xs">
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
					{stepGroups.map((step, stepIndex) => (
						<motion.div
							key={stepIndex}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: stepIndex * 0.05 }}
							className="space-y-2"
						>
							{/* Step Header */}
							{stepGroups.length > 1 && (
								<div
									className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded-md cursor-pointer hover:bg-muted/70 transition-colors"
									onClick={() => toggleStep(step.stepNumber)}
								>
									<div className="w-4 h-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
										{step.stepNumber}
									</div>
									<span className="text-xs font-medium text-muted-foreground">
										Step {step.stepNumber}
									</span>
									<span className="text-xs text-muted-foreground">
										{step.actions.length} actions
									</span>
									<div className="ml-auto">
										{expandedSteps.has(step.stepNumber) ? (
											<ChevronUpIcon size={12} />
										) : (
											<ChevronDownIcon size={12} />
										)}
									</div>
								</div>
							)}

							{/* Actions in Step */}
							<AnimatePresence>
								{expandedSteps.has(step.stepNumber) && (
									<motion.div
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: 'auto' }}
										exit={{ opacity: 0, height: 0 }}
										transition={{ duration: 0.2 }}
										className={cn(
											'space-y-1 overflow-hidden',
											stepGroups.length > 1 ? 'ml-4' : 'ml-0',
										)}
									>
										{step.actions.map((action, actionIndex) => {
											const globalIndex =
												stepGroups
													.slice(0, stepIndex)
													.reduce((acc, s) => acc + s.actions.length, 0) + actionIndex;

											return (
												<motion.div
													key={`${stepIndex}-${actionIndex}`}
													initial={{ opacity: 0, x: -10 }}
													animate={{ opacity: 1, x: 0 }}
													transition={{ delay: stepIndex * 0.05 + actionIndex * 0.02 }}
												>
													<ActionCard
														action={action}
														index={globalIndex}
														isSelected={selectedAction === globalIndex}
														isCompact={true}
														variant="list"
														onClick={() =>
															setSelectedAction(selectedAction === globalIndex ? null : globalIndex)
														}
													/>
												</motion.div>
											);
										})}
									</motion.div>
								)}
							</AnimatePresence>
						</motion.div>
					))}
				</AnimatePresence>
			</div>
		);
	};

	if (canvasState === 'empty') {
		return renderEmptyState();
	}

	return (
		<div className="flex flex-col h-full">
			{/* Simple Header - Only when needed */}
			{!isCompact && actions.length > 10 && (
				<div className="flex items-center justify-between px-4 py-2 border-b bg-background/50">
					<span className="text-sm text-muted-foreground">{actions.length} actions</span>

					<div className="flex border rounded-md">
						{(['timeline', 'list'] as const).map((mode) => (
							<Button
								key={mode}
								variant={viewMode === mode ? 'default' : 'ghost'}
								size="sm"
								className="rounded-none first:rounded-l-md last:rounded-r-md h-6 px-2 text-xs"
								onClick={() => setViewMode(mode)}
							>
								{mode === 'timeline' ? 'Timeline' : 'List'}
							</Button>
						))}
					</div>
				</div>
			)}

			{/* Canvas Content */}
			<div className="flex-1 overflow-hidden">
				<ScrollArea className="h-full" ref={scrollAreaRef}>
					{(viewMode === 'timeline' || viewMode === 'grid') && renderTimelineView()}
					{viewMode === 'list' && renderListView()}
				</ScrollArea>
			</div>
		</div>
	);
}

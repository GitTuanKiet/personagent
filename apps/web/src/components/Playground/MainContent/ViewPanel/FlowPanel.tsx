'use client';

import { useState } from 'react';
import {
	Collapsible,
	CollapsibleTrigger,
	CollapsibleContent,
} from '@workspace/ui/components/collapsible';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import {
	FolderIcon,
	FolderOpenIcon,
	PlayIcon,
	CheckCircleIcon,
	ChevronDownIcon,
	ChevronRightIcon,
	MonitorIcon,
	MousePointerClickIcon,
	TypeIcon,
	SearchIcon,
	EyeIcon,
} from 'lucide-react';
import { usePlaygroundStore } from '@/store/playground';

// Define BrowserToolCall type locally since import path doesn't work
interface BrowserToolCall {
	id?: string;
	name: string;
	args: any;
}

interface StepData {
	stepNumber: number;
	actions: BrowserToolCall[];
	timestamp?: string;
}

// Get appropriate icon for each browser action
const getActionIcon = (actionName: string) => {
	switch (actionName.toLowerCase()) {
		case 'click':
			return <MousePointerClickIcon className="text-blue-500" size={12} />;
		case 'type':
		case 'fill':
			return <TypeIcon className="text-green-500" size={12} />;
		case 'scroll':
			return <MonitorIcon className="text-purple-500" size={12} />;
		case 'navigate':
			return <SearchIcon className="text-orange-500" size={12} />;
		case 'wait':
			return <PlayIcon className="text-yellow-500" size={12} />;
		case 'screenshot':
			return <EyeIcon className="text-cyan-500" size={12} />;
		default:
			return <CheckCircleIcon className="text-gray-500" size={12} />;
	}
};

// Format action arguments for display
const formatActionArgs = (args: any): string => {
	if (!args || typeof args !== 'object') {
		return String(args || '');
	}

	// Common browser action arguments
	if (args.selector) {
		return `selector: ${args.selector}`;
	}
	if (args.text) {
		return `text: "${args.text}"`;
	}
	if (args.url) {
		return `url: ${args.url}`;
	}
	if (args.x !== undefined && args.y !== undefined) {
		return `position: (${args.x}, ${args.y})`;
	}
	if (args.direction) {
		return `direction: ${args.direction}`;
	}

	// Fallback to JSON string for complex objects
	try {
		return JSON.stringify(args, null, 0);
	} catch {
		return String(args);
	}
};

export default function FlowPanel() {
	const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([1]));

	// Get current simulation from store
	const { getPinnedSimulation } = usePlaygroundStore();
	const currentSimulation = getPinnedSimulation();

	// Extract scripts from simulation state
	const scripts: Record<number, BrowserToolCall[]> = currentSimulation?.state?.scripts || {};

	// Convert scripts to processedSteps
	const processedSteps: StepData[] = Object.entries(scripts)
		.map(([stepNum, actions]) => ({
			stepNumber: parseInt(stepNum),
			actions: actions || [],
			timestamp: currentSimulation?.updatedAt
				? new Date(currentSimulation.updatedAt).toISOString()
				: undefined,
		}))
		.sort((a, b) => a.stepNumber - b.stepNumber);

	const toggleStep = (stepNumber: number) => {
		const newExpanded = new Set(expandedSteps);
		if (newExpanded.has(stepNumber)) {
			newExpanded.delete(stepNumber);
		} else {
			newExpanded.add(stepNumber);
		}
		setExpandedSteps(newExpanded);
	};

	const expandAll = () => {
		setExpandedSteps(new Set(processedSteps.map((step) => step.stepNumber)));
	};

	const collapseAll = () => {
		setExpandedSteps(new Set());
	};

	return (
		<div className={`h-full`}>
			{/* VSCode-style Browser Flow Explorer */}
			<div className="h-full flex flex-col">
				{/* Header */}
				<div className="px-3 py-2 border-b bg-muted/20">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2 text-sm font-medium">
							<FolderIcon size={14} />
							Browser Flow
							{processedSteps.length > 0 && (
								<Badge variant="secondary" className="text-xs">
									{processedSteps.length} steps
								</Badge>
							)}
						</div>

						{/* Expand/Collapse Controls */}
						{processedSteps.length > 0 && (
							<div className="flex items-center gap-1">
								<Button variant="ghost" size="sm" onClick={expandAll} className="h-6 px-2 text-xs">
									Expand All
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={collapseAll}
									className="h-6 px-2 text-xs"
								>
									Collapse All
								</Button>
							</div>
						)}
					</div>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-auto">
					{processedSteps.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-full text-muted-foreground">
							<FolderIcon size={32} className="mb-3 opacity-50" />
							<p className="text-sm">No browser actions yet</p>
							<p className="text-xs opacity-75">Start a simulation to see browser flow</p>
						</div>
					) : (
						<div className="p-1">
							{processedSteps.map((step) => (
								<Collapsible key={step.stepNumber} open={expandedSteps.has(step.stepNumber)}>
									{/* Step Header - VSCode style */}
									<CollapsibleTrigger asChild>
										<Button
											variant="ghost"
											className="w-full p-1 h-auto justify-start hover:bg-muted/50 rounded-sm"
											onClick={() => toggleStep(step.stepNumber)}
										>
											<div className="flex items-center gap-1 text-sm w-full">
												{expandedSteps.has(step.stepNumber) ? (
													<ChevronDownIcon size={10} className="text-muted-foreground" />
												) : (
													<ChevronRightIcon size={10} className="text-muted-foreground" />
												)}
												{expandedSteps.has(step.stepNumber) ? (
													<FolderOpenIcon className="text-blue-500" size={14} />
												) : (
													<FolderIcon className="text-blue-500" size={14} />
												)}
												<span className="font-medium">Step {step.stepNumber}</span>
												<Badge variant="outline" className="text-xs ml-auto">
													{step.actions.length} action{step.actions.length !== 1 ? 's' : ''}
												</Badge>
											</div>
										</Button>
									</CollapsibleTrigger>

									{/* Step Actions - VSCode style */}
									<CollapsibleContent>
										<div className="ml-6 space-y-1">
											{step.actions.map((action, actionIndex) => (
												<div
													key={actionIndex}
													className="flex items-start gap-2 p-2 rounded hover:bg-muted/30 transition-colors"
												>
													<div className="flex-shrink-0 mt-0.5">{getActionIcon(action.name)}</div>

													<div className="flex-1 min-w-0">
														<div className="flex items-center gap-2">
															<span className="font-medium text-sm text-foreground">
																{action.name}
															</span>
															<Badge variant="secondary" className="text-xs">
																{action.id?.slice(-8) || `#${actionIndex + 1}`}
															</Badge>
														</div>

														{/* Action Arguments */}
														<div className="text-xs text-muted-foreground mt-1 font-mono">
															{formatActionArgs(action.args)}
														</div>
													</div>
												</div>
											))}
										</div>
									</CollapsibleContent>
								</Collapsible>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

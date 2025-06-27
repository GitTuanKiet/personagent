'use client';

import React, { useState } from 'react';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { Separator } from '@workspace/ui/components/separator';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@workspace/ui/components/select';
import {
	AlertTriangleIcon,
	AlertCircleIcon,
	InfoIcon,
	XIcon,
	FilterIcon,
	SortAscIcon,
	ChevronUpIcon,
	ChevronDownIcon,
	ExternalLinkIcon,
	CheckCircleIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@workspace/ui/lib/utils';
import type { UsabilityIssue } from '@/types';

export interface IssuesPanelProps {
	issues: UsabilityIssue[];
	isExpanded?: boolean;
	onToggleExpand?: () => void;
	className?: string;
}

export function IssuesPanel({
	issues,
	isExpanded = true,
	onToggleExpand,
	className = '',
}: IssuesPanelProps) {
	const [selectedIssue, setSelectedIssue] = useState<number | null>(null);
	const [filterSeverity, setFilterSeverity] = useState<string>('all');
	const [sortBy, setSortBy] = useState<'severity' | 'category' | 'step'>('severity');

	const getSeverityColor = (severity: string) => {
		switch (severity) {
			case 'critical':
			case 'high':
				return 'text-red-500 bg-red-50 border-red-200 dark:bg-red-950/20';
			case 'medium':
				return 'text-orange-500 bg-orange-50 border-orange-200 dark:bg-orange-950/20';
			case 'low':
				return 'text-yellow-500 bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20';
			default:
				return 'text-gray-500 bg-gray-50 border-gray-200 dark:bg-gray-950/20';
		}
	};

	const getSeverityIcon = (severity: string) => {
		switch (severity) {
			case 'critical':
			case 'high':
				return <AlertTriangleIcon size={16} className="text-red-500" />;
			case 'medium':
				return <AlertCircleIcon size={16} className="text-orange-500" />;
			case 'low':
				return <InfoIcon size={16} className="text-yellow-500" />;
			default:
				return <InfoIcon size={16} className="text-gray-500" />;
		}
	};

	const filteredIssues = issues
		.filter((issue) => filterSeverity === 'all' || issue.severity === filterSeverity)
		.sort((a, b) => {
			switch (sortBy) {
				case 'severity':
					const severityOrder = { high: 3, medium: 2, low: 1 };
					return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
				case 'category':
					return (a.category || '').localeCompare(b.category || '');
				case 'step':
					return (a.stepIndex || 0) - (b.stepIndex || 0);
				default:
					return 0;
			}
		});

	const severityCounts = {
		critical: issues.filter((i) => i.severity === 'critical').length,
		high: issues.filter((i) => i.severity === 'high').length,
		medium: issues.filter((i) => i.severity === 'medium').length,
		low: issues.filter((i) => i.severity === 'low').length,
	};

	const renderHeader = () => (
		<div className="flex items-center justify-between px-4 py-2 border-b bg-background/50">
			<div className="flex items-center gap-2">
				<AlertTriangleIcon size={14} className="text-orange-500" />
				<span className="text-sm font-medium">Issues</span>
				<Badge variant="outline" className="h-5 text-xs">
					{issues.length}
				</Badge>
			</div>

			<div className="flex items-center gap-1">
				{/* Simple Filter */}
				{issues.length > 3 && (
					<Select value={filterSeverity} onValueChange={setFilterSeverity}>
						<SelectTrigger className="w-16 h-6 text-xs">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All</SelectItem>
							<SelectItem value="high">High</SelectItem>
							<SelectItem value="medium">Med</SelectItem>
							<SelectItem value="low">Low</SelectItem>
						</SelectContent>
					</Select>
				)}

				{/* Collapse */}
				{onToggleExpand && (
					<Button variant="ghost" size="sm" onClick={onToggleExpand} className="h-6 w-6 p-0">
						{isExpanded ? <ChevronDownIcon size={12} /> : <ChevronUpIcon size={12} />}
					</Button>
				)}
			</div>
		</div>
	);

	const renderIssueCard = (issue: UsabilityIssue, index: number) => {
		const isSelected = selectedIssue === index;

		return (
			<motion.div
				key={index}
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: index * 0.05 }}
				className={cn(
					'border rounded-md bg-background/50 hover:bg-background/80 cursor-pointer transition-all group',
					'border-l-2',
					issue.severity === 'high' && 'border-l-red-400',
					issue.severity === 'medium' && 'border-l-orange-400',
					issue.severity === 'low' && 'border-l-yellow-400',
					isSelected && 'ring-1 ring-primary',
				)}
				onClick={() => setSelectedIssue(isSelected ? null : index)}
			>
				<div className="p-3">
					{/* Issue Header */}
					<div className="flex items-start justify-between gap-2 mb-2">
						<div className="flex items-center gap-2 min-w-0">
							{getSeverityIcon(issue.severity)}
							<h4 className="font-medium text-sm truncate">
								{issue.title || `Issue ${index + 1}`}
							</h4>
						</div>

						<div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
							<Badge variant="outline" className="h-5 text-xs">
								{issue.severity}
							</Badge>
						</div>
					</div>

					{/* Issue Description - Compact */}
					<p className="text-xs text-muted-foreground mb-2 line-clamp-2">{issue.description}</p>

					{/* Category and Step Info */}
					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<span className="capitalize">{issue.category || 'usability'}</span>
						{issue.stepIndex !== undefined && <span>Step {issue.stepIndex + 1}</span>}
					</div>

					{/* Expanded Details (only when selected) */}
					<AnimatePresence>
						{isSelected && (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
								className="mt-3 pt-3 border-t space-y-2"
							>
								{/* Full Description */}
								<p className="text-sm text-foreground">{issue.description}</p>

								{/* Element */}
								{issue.element && (
									<div className="text-xs text-muted-foreground">
										<span className="font-medium">Element:</span>{' '}
										<code className="bg-muted px-1 rounded text-xs">{issue.element}</code>
									</div>
								)}

								{/* Recommendation */}
								{issue.recommendation && (
									<div className="p-2 bg-muted/50 rounded text-xs">
										<span className="font-medium text-muted-foreground">Recommendation:</span>{' '}
										<span className="text-foreground">{issue.recommendation}</span>
									</div>
								)}

								{/* Actions */}
								<div className="flex items-center justify-between pt-2">
									<span className="text-xs text-muted-foreground">
										Impact: <span className="capitalize">{issue.impact}</span>
									</span>

									<Button
										size="sm"
										variant="ghost"
										className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100"
										onClick={(e) => {
											e.stopPropagation();
											// TODO: Mark as resolved
										}}
									>
										<CheckCircleIcon size={12} />
										Resolve
									</Button>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</motion.div>
		);
	};

	const renderEmptyState = () => (
		<div className="flex flex-col items-center justify-center h-40 text-center p-8">
			<div className="w-12 h-12 bg-green-100 dark:bg-green-950/20 rounded-full flex items-center justify-center mb-3">
				<CheckCircleIcon size={20} className="text-green-600" />
			</div>
			<h4 className="font-medium text-sm mb-1">No Issues Found</h4>
			<p className="text-xs text-muted-foreground">
				Great! The simulation completed without any usability issues.
			</p>
		</div>
	);

	if (issues.length === 0) {
		return (
			<div className={cn('flex flex-col', className)}>
				{renderHeader()}
				{renderEmptyState()}
			</div>
		);
	}

	return (
		<div className={cn('flex flex-col h-full', className)}>
			{renderHeader()}

			<div className="flex-1 overflow-hidden">
				<ScrollArea className="h-full">
					<div className="p-4 space-y-3">
						<AnimatePresence>
							{filteredIssues.map((issue, index) => renderIssueCard(issue, index))}
						</AnimatePresence>
					</div>
				</ScrollArea>
			</div>
		</div>
	);
}

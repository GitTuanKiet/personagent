import React from 'react';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import {
	ChevronUpIcon,
	ChevronDownIcon,
	AlertTriangleIcon,
	InfoIcon,
	XCircleIcon,
} from 'lucide-react';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@workspace/ui/components/accordion';
import { cn } from '@workspace/ui/lib/utils';
import { UsabilityIssue } from '@/types';
import type { LayoutType } from './types';

interface IssuePanelProps {
	issues: UsabilityIssue[];
	isExpanded: boolean;
	onToggleExpand: () => void;
	layout: LayoutType;
}

export const IssuesPanel: React.FC<IssuePanelProps> = ({
	issues,
	isExpanded,
	onToggleExpand,
	layout,
}) => {
	const getSeverityConfig = (severity: UsabilityIssue['severity']) => {
		switch (severity) {
			case 'critical':
				return {
					color: 'bg-red-100 text-red-800 border-red-200',
					icon: <XCircleIcon className="h-3 w-3" />,
					borderClass: 'border-l-red-500 border-l-4',
				};
			case 'high':
				return {
					color: 'bg-orange-100 text-orange-800 border-orange-200',
					icon: <AlertTriangleIcon className="h-3 w-3" />,
					borderClass: 'border-l-orange-500 border-l-3',
				};
			case 'medium':
				return {
					color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
					icon: <InfoIcon className="h-3 w-3" />,
					borderClass: 'border-l-yellow-500 border-l-3',
				};
			case 'low':
			default:
				return {
					color: 'bg-blue-100 text-blue-800 border-blue-200',
					icon: <InfoIcon className="h-3 w-3" />,
					borderClass: 'border-l-blue-500 border-l-2',
				};
		}
	};

	return (
		<div className={cn('flex flex-col h-full bg-background border-l min-w-0')}>
			<div className="flex items-center justify-between px-4 py-2 border-b bg-muted/40 flex-shrink-0">
				<div className="flex items-center gap-2 min-w-0">
					<AlertTriangleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0" />
					<span className="font-semibold truncate">Usability Issues</span>
					<Badge variant={issues.length > 0 ? 'destructive' : 'outline'} className="flex-shrink-0">
						{issues.length}
					</Badge>
				</div>
				<Button
					size="icon"
					variant="ghost"
					onClick={onToggleExpand}
					aria-label="Toggle expand"
					className="flex-shrink-0"
				>
					{isExpanded ? (
						<ChevronDownIcon className="w-5 h-5" />
					) : (
						<ChevronUpIcon className="w-5 h-5" />
					)}
				</Button>
			</div>
			{isExpanded && (
				<ScrollArea className="flex-1 min-h-0">
					<div className="px-3 py-2 overflow-y-auto space-y-3">
						{issues.length === 0 ? (
							<div className="text-muted-foreground italic py-8 text-center">
								No issues detected
							</div>
						) : (
							issues.map((issue, idx) => {
								const severityConfig = getSeverityConfig(issue.severity);

								return (
									<div
										key={idx}
										className={cn(
											'border rounded-md bg-background min-w-0',
											severityConfig.borderClass,
										)}
									>
										<Accordion type="single" collapsible className="w-full">
											<AccordionItem value="details" className="border-none">
												<AccordionTrigger className="px-3 py-2 hover:no-underline">
													<div
														className={cn(
															'w-full min-w-0',
															layout === 'split' ? 'flex flex-col gap-1' : 'flex items-start gap-2',
														)}
													>
														<Badge
															className={`${severityConfig.color} border text-xs flex items-center gap-1 flex-shrink-0 max-w-[5rem] truncate whitespace-nowrap`}
														>
															{severityConfig.icon}
															<span className="text-ellipsis">{issue.severity.toUpperCase()}</span>
														</Badge>
														<div className="flex-1 min-w-0 text-left">
															<p className="text-sm font-medium text-foreground break-words text-left">
																{issue.title || issue.description}
															</p>
															{issue.title && (
																<p className="text-xs text-muted-foreground break-words text-left mt-1">
																	{issue.description}
																</p>
															)}
														</div>
													</div>
												</AccordionTrigger>
												<AccordionContent className="px-3 pb-2">
													<div className="space-y-2 pt-1 border-t">
														{issue.recommendation && (
															<p className="text-xs text-green-700 break-words">
																💡 {issue.recommendation}
															</p>
														)}
														<div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
															<div className="flex flex-wrap gap-2">
																<span className="px-2 py-1 bg-muted/50 rounded text-xs">
																	Category: {issue.category}
																</span>
																<span className="px-2 py-1 bg-muted/50 rounded text-xs">
																	Impact: {issue.impact}
																</span>
															</div>
															{(issue.stepIndex !== undefined || issue.element) && (
																<div className="flex flex-wrap gap-2">
																	{issue.stepIndex !== undefined && (
																		<span className="px-2 py-1 bg-muted/50 rounded text-xs">
																			Step: {issue.stepIndex}
																		</span>
																	)}
																	{issue.element && (
																		<span className="px-2 py-1 bg-muted/50 rounded text-xs break-words">
																			Element: {issue.element}
																		</span>
																	)}
																</div>
															)}
														</div>
													</div>
												</AccordionContent>
											</AccordionItem>
										</Accordion>
									</div>
								);
							})
						)}
					</div>
				</ScrollArea>
			)}
		</div>
	);
};

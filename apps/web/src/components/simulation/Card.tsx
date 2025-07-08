'use client';

import React, { useMemo } from 'react';
import { BrowserToolCall } from '@/types';
import { Badge } from '@workspace/ui/components/badge';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@workspace/ui/components/accordion';
import {
	MousePointerClickIcon,
	TypeIcon,
	NavigationIcon,
	EyeIcon,
	ClockIcon,
	CheckCircleIcon,
	ActivityIcon,
	RefreshCwIcon,
	CodeIcon,
	LayoutIcon,
	ZapIcon,
	ChevronDownIcon,
} from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { getActionConfig, getBrowserActionDescription, getSeverityBorder } from './utils';
import type { ActionConfig } from './types';

export interface ActionCardProps {
	action: BrowserToolCall;
	index: number;
	isSelected?: boolean;
	isCompact?: boolean;
	onClick?: () => void;
}

export function ActionCard({
	action,
	index,
	isSelected = false,
	isCompact = false,
	onClick,
}: ActionCardProps) {
	const config: ActionConfig = useMemo(() => getActionConfig(action.name), [action.name]);
	const IconComponent = config.icon;

	if (isCompact) {
		return (
			<div
				className={cn(
					'flex items-center gap-3 p-2 rounded-md border bg-background hover:bg-accent/30 transition-colors cursor-pointer min-w-0',
					config.borderClass,
					getSeverityBorder(config.severity),
					isSelected && 'ring-2 ring-primary ring-offset-1',
				)}
				onClick={onClick}
			>
				<div className={`text-${config.color}-500 flex-shrink-0`}>
					<IconComponent size={14} />
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 min-w-0">
						<span className="font-medium text-sm truncate">{action.name.replace(/_/g, ' ')}</span>
						<Badge variant="outline" className="text-xs h-4 px-1 flex-shrink-0">
							#{index + 1}
						</Badge>
					</div>
					<p className="text-xs text-muted-foreground truncate">
						{getBrowserActionDescription(action)}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div
			className={cn(
				'border rounded-md bg-background transition-colors min-w-0',
				config.borderClass,
				getSeverityBorder(config.severity),
				isSelected && 'ring-2 ring-primary ring-offset-1',
			)}
			onClick={onClick}
		>
			<Accordion type="single" collapsible className="w-full">
				<AccordionItem value="details" className="border-none">
					<AccordionTrigger className="px-4 py-3 hover:no-underline">
						<div className="flex items-center gap-3 w-full min-w-0">
							<div className={`text-${config.color}-500 flex-shrink-0`}>
								<IconComponent size={16} />
							</div>
							<div className="flex-1 min-w-0 text-left">
								<div className="flex items-center gap-2 mb-1 min-w-0">
									<span className="font-medium text-sm">{action.name.replace(/_/g, ' ')}</span>
									<Badge variant="outline" className="text-xs h-4 px-1 flex-shrink-0">
										#{index + 1}
									</Badge>
								</div>
								<p className="text-xs text-muted-foreground break-words text-left">
									{getBrowserActionDescription(action)}
								</p>
							</div>
						</div>
					</AccordionTrigger>
					<AccordionContent className="px-4 pb-3">
						<div className="space-y-3 pt-2 border-t">
							{/* Browser Action Arguments */}
							{action.args &&
								typeof action.args === 'object' &&
								Object.keys(action.args).length > 0 && (
									<div>
										<h5 className="text-xs font-medium text-muted-foreground mb-2">Arguments</h5>
										<div className="bg-muted/50 rounded-md p-3 space-y-2">
											{Object.entries(action.args).map(([key, value]) => (
												<div key={key} className="grid grid-cols-3 gap-2 text-xs min-w-0">
													<span className="text-muted-foreground font-mono font-medium">
														{key}:
													</span>
													<span className="col-span-2 text-foreground font-mono break-words">
														{typeof value === 'string' ? value : JSON.stringify(value)}
													</span>
												</div>
											))}
										</div>
									</div>
								)}

							{/* Action Metadata */}
							<div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
								<span className="px-2 py-1 bg-muted/50 rounded">Action #{index + 1}</span>
								<span className="px-2 py-1 bg-muted/50 rounded">Type: {action.name}</span>
								<span className="px-2 py-1 bg-muted/50 rounded">Severity: {config.severity}</span>
								{action.args?.selector && (
									<span className="px-2 py-1 bg-muted/50 rounded break-words">
										Selector: {action.args.selector}
									</span>
								)}
							</div>
						</div>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	);
}

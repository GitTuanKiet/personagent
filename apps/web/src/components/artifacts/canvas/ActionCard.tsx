'use client';

import React, { useState } from 'react';
import { BrowserToolCall } from '@/types';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@workspace/ui/components/collapsible';
import {
	MousePointerClickIcon,
	TypeIcon,
	NavigationIcon,
	EyeIcon,
	ClockIcon,
	CheckCircleIcon,
	ActivityIcon,
	RefreshCwIcon,
	ChevronDownIcon,
	ChevronRightIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@workspace/ui/lib/utils';

// Action configuration constants
const ACTION_CONFIG = {
	click: { color: 'blue', icon: MousePointerClickIcon },
	click_element_by_index: { color: 'blue', icon: MousePointerClickIcon },
	type: { color: 'green', icon: TypeIcon },
	fill: { color: 'green', icon: TypeIcon },
	fill_form: { color: 'green', icon: TypeIcon },
	navigate: { color: 'purple', icon: NavigationIcon },
	navigate_to_url: { color: 'purple', icon: NavigationIcon },
	screenshot: { color: 'cyan', icon: EyeIcon },
	take_screenshot: { color: 'cyan', icon: EyeIcon },
	wait: { color: 'yellow', icon: ClockIcon },
	done: { color: 'emerald', icon: CheckCircleIcon },
	scroll: { color: 'orange', icon: RefreshCwIcon },
} as const;

const CARD_VARIANTS = {
	timeline:
		'border-l-2 pl-3 py-2 border rounded-md bg-background hover:bg-accent/30 transition-colors group',
	grid: 'p-3 border rounded-md bg-background hover:bg-accent/30 transition-colors group',
	list: 'px-3 py-2 border rounded-md bg-background hover:bg-accent/30 transition-colors group',
} as const;

export interface ActionCardProps {
	action: BrowserToolCall;
	index: number;
	isSelected?: boolean;
	isCompact?: boolean;
	variant?: 'timeline' | 'grid' | 'list';
	onClick?: () => void;
}

export function ActionCard({
	action,
	index,
	isSelected = false,
	isCompact = false,
	variant = 'timeline',
	onClick,
}: ActionCardProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	const actionKey = action.name.toLowerCase() as keyof typeof ACTION_CONFIG;
	const config = ACTION_CONFIG[actionKey] || { color: 'gray', icon: ActivityIcon };
	const IconComponent = config.icon;

	const getActionDescription = () => {
		const args = action.args || {};

		switch (action.name.toLowerCase()) {
			case 'click_element_by_index':
				return `Click element #${args.index}${args.reason ? ` - ${args.reason}` : ''}`;
			case 'fill_form':
				return `Type "${args.text}" into ${args.selector || 'input field'}`;
			case 'navigate_to_url':
				return `Navigate to ${args.url}`;
			case 'take_screenshot':
				return `Take screenshot${args.reason ? ` - ${args.reason}` : ''}`;
			case 'wait':
				return `Wait ${args.seconds || 1} seconds`;
			case 'done':
				return `Task completed${args.reason ? ` - ${args.reason}` : ''}`;
			case 'scroll':
				return `Scroll ${args.direction || 'down'}`;
			default:
				return action.name.replace(/_/g, ' ').toLowerCase();
		}
	};

	const formatArguments = () => {
		if (!action.args || typeof action.args !== 'object') return null;

		const relevantArgs = Object.entries(action.args)
			.filter(([key, value]) => value !== undefined && value !== null)
			.slice(0, isCompact ? 2 : 4);

		return relevantArgs;
	};

	return (
		<motion.div
			className={cn(
				CARD_VARIANTS[variant],
				`border-l-${config.color}-500`,
				isSelected && 'ring-2 ring-primary ring-offset-2',
				'cursor-pointer',
			)}
			onClick={onClick}
			whileHover={{ scale: variant === 'grid' ? 1.02 : 1.01 }}
			whileTap={{ scale: 0.98 }}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="flex-1 min-w-0">
					{/* Action Header */}
					<div className="flex items-center gap-2 mb-1">
						<div className={`text-${config.color}-500`}>
							<IconComponent size={16} />
						</div>
						<span className={cn('font-medium', variant === 'list' ? 'text-sm' : 'text-base')}>
							{action.name.replace(/_/g, ' ')}
						</span>
						<Badge variant="outline" className={cn('text-xs', variant === 'list' && 'h-4 px-1')}>
							#{index + 1}
						</Badge>
					</div>

					{/* Action Description */}
					<p
						className={cn(
							'text-muted-foreground',
							variant === 'list' ? 'text-xs' : 'text-sm',
							isCompact && 'line-clamp-1',
						)}
					>
						{getActionDescription()}
					</p>
				</div>

				{/* Minimal Controls */}
				{variant !== 'list' && (
					<Button
						variant="ghost"
						size="sm"
						className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
						onClick={(e) => {
							e.stopPropagation();
							setIsExpanded(!isExpanded);
						}}
						title="Toggle details"
					>
						<ChevronDownIcon
							size={10}
							className={cn('transition-transform', isExpanded && 'rotate-180')}
						/>
					</Button>
				)}
			</div>

			{/* Expanded Details */}
			{variant !== 'list' && (
				<Collapsible open={isExpanded}>
					<CollapsibleContent>
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: 'auto' }}
							exit={{ opacity: 0, height: 0 }}
							className="mt-3 pt-3 border-t space-y-2"
						>
							{/* Full Arguments */}
							{action.args && typeof action.args === 'object' && (
								<div>
									<h5 className="text-xs font-medium text-muted-foreground mb-2">Arguments</h5>
									<div className="bg-muted/50 rounded-md p-2 space-y-1">
										{Object.entries(action.args).map(([key, value]) => (
											<div key={key} className="flex items-start gap-2 text-xs">
												<span className="text-muted-foreground font-mono min-w-16">{key}:</span>
												<span className="text-foreground flex-1 font-mono text-xs">
													{typeof value === 'string' ? value : JSON.stringify(value)}
												</span>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Action Metadata */}
							<div className="flex items-center gap-4 text-xs text-muted-foreground">
								<span>Action #{index + 1}</span>
								<span>Type: {action.name}</span>
								{action.args?.selector && <span>Selector: {action.args.selector}</span>}
							</div>
						</motion.div>
					</CollapsibleContent>
				</Collapsible>
			)}
		</motion.div>
	);
}

'use client';

import { ComponentPropsWithoutRef, forwardRef } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Button } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';

export type TooltipIconButtonProps = ComponentPropsWithoutRef<typeof Button> & {
	tooltip: string;
	side?: 'top' | 'bottom' | 'left' | 'right';
	delayDuration?: number;
};

export const TooltipIconButton = forwardRef<HTMLButtonElement, TooltipIconButtonProps>(
	({ children, tooltip, side = 'bottom', className, delayDuration = 700, ...rest }, ref) => {
		return (
			<Tooltip delayDuration={delayDuration}>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						{...rest}
						className={cn('aui-button-icon', className)}
						ref={ref}
					>
						{children}
					</Button>
				</TooltipTrigger>
				<TooltipContent side={side}>{tooltip}</TooltipContent>
			</Tooltip>
		);
	},
);

TooltipIconButton.displayName = 'TooltipIconButton';

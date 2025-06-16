import React, { memo } from 'react';
import { TabsContent } from '@workspace/ui/components/tabs';
import { TerminalState } from './types';
import { tabs } from './tabsConfig';

interface TerminalContentProps extends TerminalState {}

export const TerminalContent: React.FC<TerminalContentProps> = memo(({ state }) => {
	const contentClassName =
		'h-full m-0 data-[state=active]:flex data-[state=active]:flex-col data-[state=active]:overflow-hidden';
	const containerClassName = 'flex-1 overflow-hidden bg-[#1e1e1e]';

	return (
		<div className={containerClassName}>
			{tabs.map((tab) => (
				<TabsContent key={tab.value} value={tab.value} className={contentClassName}>
					{tab.content(state)}
				</TabsContent>
			))}
		</div>
	);
});

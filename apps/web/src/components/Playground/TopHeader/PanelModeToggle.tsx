'use client';

import { usePanelMode } from '@/store/user/selectors';
import { MessageSquare, Monitor, Workflow } from 'lucide-react';

interface PanelModeToggleProps {
	variant?: 'default' | 'compact';
}

export default function PanelModeToggle({ variant = 'default' }: PanelModeToggleProps) {
	const { setChatMode, setStreamMode, setFlowMode, isChatMode, isStreamMode, isFlowMode } =
		usePanelMode();

	const modes = [
		{
			key: 'chat' as const,
			label: 'Chat',
			icon: MessageSquare,
			isActive: isChatMode,
			onClick: setChatMode,
		},
		{
			key: 'stream' as const,
			label: 'Stream',
			icon: Monitor,
			isActive: isStreamMode,
			onClick: setStreamMode,
		},
		{
			key: 'flow' as const,
			label: 'Flow',
			icon: Workflow,
			isActive: isFlowMode,
			onClick: setFlowMode,
		},
	];

	const isCompact = variant === 'compact';

	return (
		<div className={`flex gap-1 ${isCompact ? 'p-0' : 'p-1 bg-gray-100 rounded-lg'}`}>
			{modes.map(({ key, label, icon: Icon, isActive, onClick }) => (
				<button
					key={key}
					onClick={onClick}
					className={`flex items-center transition-all ${
						isCompact
							? `gap-1 px-2 py-1 rounded text-xs border ${
									!isActive
										? 'bg-gray-900 text-white border-gray-900'
										: 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
								}`
							: `gap-2 px-3 py-2 rounded text-sm font-medium ${
									!isActive
										? 'bg-white shadow-sm text-gray-900'
										: 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
								}`
					}`}
				>
					<Icon className={isCompact ? 'w-3 h-3' : 'w-4 h-4'} />
					{!isCompact && <span>{label}</span>}
				</button>
			))}
		</div>
	);
}

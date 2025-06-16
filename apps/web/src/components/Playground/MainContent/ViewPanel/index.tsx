'use client';

import { useUserStore } from '@/store/user';
import ChatPanel from './ChatPanel';
import StreamPanel from './StreamPanel';
import FlowPanel from './FlowPanel';

interface ViewPanelProps {
	className?: string;
}

export default function ViewPanel({ className = '' }: ViewPanelProps) {
	const currentPanelMode = useUserStore((state) => state.panels.currentPanelMode);

	const renderPanel = () => {
		switch (currentPanelMode) {
			case 'stream':
				return <StreamPanel />;
			case 'chat':
				return <ChatPanel />;
			case 'flow':
				return <FlowPanel />;
			default:
				return <ChatPanel />;
		}
	};

	return <div className={`flex-1 flex flex-col overflow-hidden ${className}`}>{renderPanel()}</div>;
}

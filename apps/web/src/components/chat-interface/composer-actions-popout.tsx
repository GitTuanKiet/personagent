'use client';

import { AssistantSelect } from '../assistant-select';
import { useAssistantContext } from '@/contexts/assistant-context';
import { cn } from '@workspace/ui/lib/utils';

interface ComposerActionsPopOutProps {
	chatStarted: boolean;
}

export function ComposerActionsPopOut(props: ComposerActionsPopOutProps) {
	const { selectedAssistant } = useAssistantContext();
	const isDefaultSelected = !!selectedAssistant?.metadata?.isDefault;

	return (
		<div className="rounded-lg flex items-center h-8 justify-start px-2 py-2 bg-muted overflow-hidden transition-colors">
			<AssistantSelect
				chatStarted={props.chatStarted}
				className={cn(
					'hover:bg-blue-100 transition-colors ease-in-out',
					!isDefaultSelected && 'bg-blue-100',
				)}
			/>
		</div>
	);
}

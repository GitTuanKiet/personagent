'use client';

import React, { useState, useEffect } from 'react';
import { Progress } from '@workspace/ui/components/progress';
import { ProductLogo } from '@/components/Branding';
import { useUserContext } from '@/contexts/user-context';
import { useApplicationContext } from '@/contexts/application-context';
import { useAssistantContext } from '@/contexts/assistant-context';
import { useThreadContext } from '@/contexts/thread-context';
import FullscreenLoading from '../loading/fullscreen-loading';

export enum PlaygroundLoadingStage {
	Idle = 'idle',
	InitUser = 'initUser',
	InitData = 'initData',
	Ready = 'ready',
}

export const PLAYGROUND_LOADING_STAGES = [
	PlaygroundLoadingStage.Idle,
	PlaygroundLoadingStage.InitUser,
	PlaygroundLoadingStage.InitData,
	PlaygroundLoadingStage.Ready,
];

interface PlaygroundFallbackProps {
	onReady?: () => void;
}

const PlaygroundFallback: React.FC<PlaygroundFallbackProps> = ({ onReady }) => {
	const [currentStage, setCurrentStage] = useState<PlaygroundLoadingStage>(
		PlaygroundLoadingStage.Idle,
	);

	const { isLoading: isUserLoading, error: userError } = useUserContext();
	const { isLoadingAllApplications: isAppLoading } = useApplicationContext();
	const { isLoadingAllAssistants: isAssistantLoading } = useAssistantContext();
	const { isUserThreadsLoading: isThreadLoading } = useThreadContext();

	const isError = userError;

	useEffect(() => {
		if (isUserLoading) {
			setCurrentStage(PlaygroundLoadingStage.InitUser);
		} else if (isAppLoading || isAssistantLoading || isThreadLoading) {
			setCurrentStage(PlaygroundLoadingStage.InitData);
		} else {
			setCurrentStage(PlaygroundLoadingStage.Ready);
		}
	}, [isUserLoading, isAppLoading, isAssistantLoading, isThreadLoading]);

	return (
		<FullscreenLoading
			activeStage={PLAYGROUND_LOADING_STAGES.indexOf(currentStage)}
			stages={PLAYGROUND_LOADING_STAGES}
			// contentRender={isError && <InitError />}
		/>
	);
};

export default PlaygroundFallback;

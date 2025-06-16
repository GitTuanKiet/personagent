import dynamic from 'next/dynamic';
import React, { memo } from 'react';

import FullscreenLoading from '@/components/Loading/FullscreenLoading';
import { useGlobalStore } from '@/store/global';

import { CLIENT_LOADING_STAGES, AppLoadingStage } from '../stage';
import { ClientDatabaseInitStage } from '@/database/client/types';

const InitError = dynamic(() => import('./Error'), { ssr: false });

interface InitProps {
	setActiveStage: (value: string) => void;
}

const Init = memo<InitProps>(({ setActiveStage }) => {
	const useInitClientDB = useGlobalStore((s) => s.useInitClientDB);

	useInitClientDB({ onStateChange: setActiveStage });

	return null;
});

interface ContentProps {
	loadingStage: string;
	setActiveStage: (value: string) => void;
}

const Content = memo<ContentProps>(({ loadingStage, setActiveStage }) => {
	const isNotReady = useGlobalStore((s) => s.initClientDBStage !== ClientDatabaseInitStage.Ready);
	const isError = useGlobalStore((s) => s.initClientDBStage === ClientDatabaseInitStage.Error);

	return (
		<>
			{isNotReady && <Init setActiveStage={setActiveStage} />}
			<FullscreenLoading
				activeStage={CLIENT_LOADING_STAGES.indexOf(loadingStage as AppLoadingStage)}
				contentRender={isError && <InitError />}
				stages={CLIENT_LOADING_STAGES}
			/>
		</>
	);
});

export default Content;

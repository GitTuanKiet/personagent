'use client';

import { useRouter } from 'next/navigation';
import { memo, useEffect } from 'react';

import { useGlobalStore } from '@/store/global';
import { useUserStore } from '@/store/user';

import { AppLoadingStage } from '../stage';
import { ClientDatabaseInitStage } from '@/database/client/types';

interface RedirectProps {
	setActiveStage: (value: AppLoadingStage) => void;
}

const Redirect = memo<RedirectProps>(({ setActiveStage }) => {
	const router = useRouter();
	const isReady = useGlobalStore((s) => s.initClientDBStage === ClientDatabaseInitStage.Ready);
	const visitorId = useUserStore((s) => s.visitorId);

	const navToApp = () => {
		setActiveStage(AppLoadingStage.GoToApp);
		router.replace('/playground');
	};

	useEffect(() => {
		if (isReady) {
			if (!visitorId) {
				// if fingerprint not found, wait for loading
				setActiveStage(AppLoadingStage.InitBrowser);
				return;
			}

			// go to app if fingerprint found
			navToApp();
		}
	}, [isReady, visitorId]);

	return null;
});

export default Redirect;

'use client';
import { useRouter } from 'next/navigation';
import { useGlobalStore } from '@/store/global';
import { ClientDatabaseInitStage } from '@/database/client/types';
import { useEffect } from 'react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const isReady = useGlobalStore((s) => s.initClientDBStage === ClientDatabaseInitStage.Ready);

	useEffect(() => {
		if (!isReady) {
			router.replace('/');
		}
	}, [isReady, router]);

	return <>{children}</>;
}

'use client';

import { useEffect } from 'react';
import { usePlaygroundStore } from '@/store/playground';
import { useGlobalStore } from '@/store/global';
import { ClientDatabaseInitStage } from '@/database/client/types';
import { useParams } from 'next/navigation';
import MainContent from './MainContent';

export default function PlaygroundPage() {
	const params = useParams();
	const simulationId = params?.simulationId as string | undefined;

	// Get simulation loading function
	const setCurrentSimulation = usePlaygroundStore((state) => state.setCurrentSimulation);
	const initClientDBStage = useGlobalStore((state) => state.initClientDBStage);

	// Set current simulation ID when component mounts or ID changes
	useEffect(() => {
		if (initClientDBStage !== ClientDatabaseInitStage.Ready) {
			console.log('⏳ DB not ready, skipping...');
			return;
		}

		const newSimulationId =
			simulationId === 'new' ? null : simulationId ? parseInt(simulationId) : null;

		setCurrentSimulation(newSimulationId);
	}, [simulationId, setCurrentSimulation, initClientDBStage]);

	return <MainContent />;
}

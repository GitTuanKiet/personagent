'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { Button } from '@workspace/ui/components/button';
import { MessageCircleIcon, ChevronDownIcon } from 'lucide-react';
import { usePlaygroundStore } from '@/store/playground';
import { useGlobalStore } from '@/store/global';
import { ClientDatabaseInitStage } from '@/database/client/types';
import CircleLoading from '@/components/Loading/CircleLoading';
import SkeletonLoading from '@/components/Loading/SkeletonLoading';
import SimulationItem from './SimulationItem';

// Custom hook to manage simulation list data
const useSimulationListData = () => {
	const simulations = usePlaygroundStore((state) => state.simulations);
	const isSimulationLoading = usePlaygroundStore((state) => state.isSimulationLoading);
	const hasMoreSimulation = usePlaygroundStore((state) => state.hasMoreSimulation);
	const loadSimulationList = usePlaygroundStore((state) => state.loadSimulationList);
	const initClientDBStage = useGlobalStore((state) => state.initClientDBStage);

	const hasLoadedInitialData = useRef(false);

	// Memoize loadMore function
	const handleLoadMore = useCallback(async () => {
		try {
			await loadSimulationList();
		} catch (error) {
			console.error('Failed to load more simulations:', error);
		}
	}, [loadSimulationList]);

	// Load simulations only once when database is ready
	useEffect(() => {
		if (initClientDBStage === ClientDatabaseInitStage.Ready && !hasLoadedInitialData.current) {
			hasLoadedInitialData.current = true;
			loadSimulationList(true);
		}
	}, [loadSimulationList, initClientDBStage]);

	return {
		simulations: simulations,
		isSimulationLoading,
		hasMoreSimulation,
		handleLoadMore,
		isReady: initClientDBStage === ClientDatabaseInitStage.Ready,
	};
};

export default function SimulationList() {
	const { simulations, isSimulationLoading, hasMoreSimulation, handleLoadMore, isReady } =
		useSimulationListData();

	if (!isReady) {
		return <SkeletonLoading />;
	}

	return (
		<ScrollArea className="h-full">
			<div className="p-2 space-y-1">
				{/* Header */}
				<div className="flex items-center justify-between mb-2">
					<h3 className="text-sm font-medium text-muted-foreground">Simulations</h3>
					<MessageCircleIcon size={14} className="text-muted-foreground" />
				</div>

				{/* Simulation List */}
				{simulations.length === 0 && !isSimulationLoading ? (
					<div className="text-center py-8">
						<MessageCircleIcon size={24} className="mx-auto mb-2 text-muted-foreground" />
						<p className="text-sm text-muted-foreground">No simulations yet</p>
						<p className="text-xs text-muted-foreground/70">
							Create a new simulation to get started
						</p>
					</div>
				) : (
					<>
						{simulations.map((simulation) => (
							<SimulationItem key={simulation.id} item={simulation} />
						))}

						{/* Load More Button */}
						{hasMoreSimulation && (
							<Button
								onClick={handleLoadMore}
								variant="ghost"
								size="sm"
								className="w-full mt-2 text-xs"
								disabled={isSimulationLoading}
							>
								{isSimulationLoading ? (
									<CircleLoading />
								) : (
									<>
										<ChevronDownIcon size={12} className="mr-1" />
										Load More
									</>
								)}
							</Button>
						)}
					</>
				)}
			</div>
		</ScrollArea>
	);
}

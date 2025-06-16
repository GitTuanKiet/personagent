'use client';

import { ScrollArea } from '@workspace/ui/components/scroll-area';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import {
	MessageCircleIcon,
	PlayIcon,
	PauseIcon,
	CheckCircleIcon,
	XCircleIcon,
	PinIcon,
	ChevronDownIcon,
	LoaderCircleIcon,
	MoreHorizontalIcon,
	TrashIcon,
} from 'lucide-react';
import { usePlaygroundStore } from '@/store/playground';
import type { SimulationSelect, SimulationStatus } from '@/database/client/schema';
import { useEffect } from 'react';
import { Label } from '@workspace/ui/components/label';
import CircleLoading from '@/components/Loading/CircleLoading';
import SkeletonLoading from '@/components/Loading/SkeletonLoading';
import { useGlobalStore } from '@/store/global';
import { ClientDatabaseInitStage } from '@/database/client/types';

const getStatusIcon = (status: SimulationStatus) => {
	switch (status) {
		case 'running':
			return <PlayIcon size={14} className="text-green-500" />;
		case 'stopped':
			return <PauseIcon size={14} className="text-yellow-500" />;
		case 'completed':
			return <CheckCircleIcon size={14} className="text-green-500" />;
		case 'failed':
			return <XCircleIcon size={14} className="text-red-500" />;
		case 'idle':
			return <LoaderCircleIcon size={14} className="text-yellow-500 animate-spin" />;
		default:
			return <LoaderCircleIcon size={14} className="text-gray-500 animate-spin" />;
	}
};

function SimulationItem({ simulation }: { simulation: SimulationSelect }) {
	const { removeSimulation, handlePinnedSimulation } = usePlaygroundStore();
	const isPinned = simulation.pinned;

	const handleRemove = async (e: React.MouseEvent) => {
		e.stopPropagation();
		try {
			await removeSimulation(simulation.id);
		} catch (error) {
			console.error('Failed to remove simulation:', error);
		}
	};

	const handleSelectSimulation = () => {
		handlePinnedSimulation(simulation.id);
	};

	return (
		<div
			className={`px-1 rounded-lg cursor-pointer transition-all duration-200 ${
				isPinned ? 'bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted/50'
			}`}
			onClick={handleSelectSimulation}
		>
			<div className="flex items-center gap-2">
				{getStatusIcon(simulation.status)}
				<Label className="text-xs font-medium truncate flex-1 cursor-pointer">
					{simulation.task}
				</Label>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							className="p-0.5 rounded hover:bg-transparent focus:outline-none focus:ring-0 focus:bg-transparent active:bg-transparent transition-colors flex items-center justify-center"
							onClick={(e) => e.stopPropagation()}
						>
							<MoreHorizontalIcon size={10} />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="w-36">
						<DropdownMenuItem
							onClick={handleRemove}
							className="text-destructive focus:text-destructive cursor-pointer"
						>
							<TrashIcon size={14} className="mr-2" />
							Remove
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}

export default function SimulationList() {
	const { simulations, hasMoreSimulation, isSimulationLoading, loadSimulations } =
		usePlaygroundStore();
	const { initClientDBStage } = useGlobalStore();

	useEffect(() => {
		if (initClientDBStage === ClientDatabaseInitStage.Ready) {
			loadSimulations();
		}
	}, [loadSimulations, initClientDBStage]);

	return (
		<ScrollArea className="h-full">
			<div className="px-3 py-2 space-y-2">
				{/* Show skeleton loading on initial load */}
				{isSimulationLoading && simulations.length === 0 && (
					<SkeletonLoading lines={5} height="h-8" className="px-2" />
				)}

				{simulations.map((simulation) => (
					<SimulationItem key={simulation.id} simulation={simulation} />
				))}

				{/* Show circle loading for pagination */}
				{isSimulationLoading && simulations.length > 0 && (
					<div className="flex justify-center py-2">
						<CircleLoading size="small" />
					</div>
				)}

				{/* Show more button */}
				{hasMoreSimulation && (
					<button
						onClick={() => loadSimulations()}
						className="w-full flex items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors py-2"
					>
						<ChevronDownIcon size={14} />
						<Label className="text-xs cursor-pointer">Show more</Label>
					</button>
				)}
			</div>

			{/* Empty States */}
			{simulations.length === 0 && !isSimulationLoading && (
				<div className="text-center p-6 text-muted-foreground">
					<MessageCircleIcon size={40} className="mx-auto mb-3 opacity-30" />
					<h3 className="font-medium text-sm mb-2">No simulations yet</h3>
					<p className="text-xs opacity-75">Create your first AI test by clicking above</p>
				</div>
			)}
		</ScrollArea>
	);
}

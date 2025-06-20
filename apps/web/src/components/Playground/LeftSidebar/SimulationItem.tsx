'use client';

import { useCallback, type FC } from 'react';
import { useRouter } from 'next/navigation';
import { usePlaygroundStore } from '@/store/playground';
import { useUserStore } from '@/store/user';
import { Label } from '@workspace/ui/components/label';
import { Button } from '@workspace/ui/components/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import {
	MoreHorizontalIcon,
	StopCircleIcon,
	TrashIcon,
	PlayIcon,
	PauseIcon,
	CheckCircleIcon,
	XCircleIcon,
	LoaderCircleIcon,
} from 'lucide-react';
import type { SimulationListItem } from '@/store/playground/slices/simulation';
import type { SimulationStatus } from '@/database/client/schema';

const getStatusIcon = (status: SimulationStatus) => {
	switch (status) {
		case 'running':
			return <LoaderCircleIcon size={14} className="text-green-500 animate-spin" />;
		case 'stopped':
			return <PauseIcon size={14} className="text-yellow-500" />;
		case 'completed':
			return <CheckCircleIcon size={14} className="text-green-500" />;
		case 'failed':
			return <XCircleIcon size={14} className="text-red-500" />;
		case 'idle':
		default:
			return <PlayIcon size={14} className="text-gray-500" />;
	}
};

const getStatusText = (status: SimulationStatus): string => {
	switch (status) {
		case 'running':
			return 'Running';
		case 'stopped':
			return 'Stopped';
		case 'completed':
			return 'Completed';
		case 'failed':
			return 'Failed';
		case 'idle':
			return 'Idle';
		default:
			return 'Unknown';
	}
};

const SimulationItem: FC<{ item: SimulationListItem }> = ({ item }) => {
	const router = useRouter();
	// Optimize store selectors
	const removeSimulation = usePlaygroundStore((state) => state.removeSimulation);
	const stopSimulation = usePlaygroundStore((state) => state.stopSimulation);
	const runningSimulationId = usePlaygroundStore((state) => state.runningSimulationId);
	const currentSimulation = usePlaygroundStore((state) => state.currentSimulation);
	const setPanelMode = useUserStore((state) => state.setPanelMode);

	const isSelected = item.id === currentSimulation?.id;
	const isRunning = item.status === 'running';
	const canStop = isRunning && runningSimulationId === item.id;

	const handleRemove = useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation();
			try {
				await removeSimulation(item.id);
			} catch (error) {
				console.error('Failed to remove simulation:', error);
			}
		},
		[removeSimulation, item.id],
	);

	const handleStop = useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation();
			try {
				await stopSimulation();
			} catch (error) {
				console.error('Failed to stop simulation:', error);
			}
		},
		[stopSimulation],
	);

	const handleSelectSimulation = useCallback(() => {
		router.push(`/playground/${item.id}`);
		setPanelMode('chat');
	}, [router, item.id, setPanelMode]);

	return (
		<div
			className={`px-1 py-1 rounded-lg cursor-pointer transition-all duration-200 ${
				isSelected ? 'bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted/50'
			}`}
			onClick={handleSelectSimulation}
			role="button"
			tabIndex={0}
			aria-label={`Select simulation: ${item.task}`}
		>
			<div className="flex items-center gap-1">
				{/* Status Icon */}
				<div className="flex-shrink-0" title={getStatusText(item.status)}>
					{getStatusIcon(item.status)}
				</div>

				{/* Task Label - Flexible width with proper truncation */}
				<div className="flex-1 min-w-0 max-w-[140px]">
					<Label className="text-xs font-medium truncate block cursor-pointer" title={item.task}>
						{item.task}
					</Label>
				</div>

				{/* Action Buttons - Fixed width */}
				<div className="flex items-center gap-0.5 flex-shrink-0 ml-auto">
					{/* Stop Button for running simulation */}
					{canStop && (
						<Button
							onClick={handleStop}
							size="sm"
							variant="ghost"
							className="p-0.5 h-5 w-5 text-red-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
							title="Stop simulation"
						>
							<StopCircleIcon size={12} />
						</Button>
					)}

					{/* Dropdown Menu */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								className="p-0.5 h-5 w-5 rounded hover:bg-muted/50 focus:outline-none focus:ring-1 focus:ring-ring transition-colors flex items-center justify-center flex-shrink-0"
								onClick={(e) => e.stopPropagation()}
								aria-label="Simulation options"
							>
								<MoreHorizontalIcon size={10} />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-36">
							{canStop && (
								<DropdownMenuItem
									onClick={handleStop}
									className="text-orange-600 focus:text-orange-600 cursor-pointer"
								>
									<StopCircleIcon size={14} className="mr-2" />
									Stop
								</DropdownMenuItem>
							)}
							<DropdownMenuItem
								onClick={handleRemove}
								className="text-destructive focus:text-destructive cursor-pointer"
								disabled={canStop}
							>
								<TrashIcon size={14} className="mr-2" />
								Remove
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</div>
	);
};

export default SimulationItem;

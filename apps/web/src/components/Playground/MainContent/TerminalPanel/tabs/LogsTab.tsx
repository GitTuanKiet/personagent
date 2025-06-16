import React from 'react';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { Separator } from '@workspace/ui/components/separator';
import { TerminalIcon } from 'lucide-react';
import { SimulationSelect } from '@/database/client/schema';
import { usePlaygroundStore } from '@/store/playground';

interface LogsTabProps {
	state?: SimulationSelect['state'];
}

export const LogsTab: React.FC<LogsTabProps> = ({ state }) => {
	const currentSimulation = usePlaygroundStore.getState().getPinnedSimulation();
	const simulationResults = state?.results || [];
	const logs = simulationResults.filter((result) => result.result?.includes('error'));

	return (
		<div className="h-full">
			<ScrollArea className="h-full">
				<div className="p-3 text-[#cccccc] font-mono text-sm">
					{currentSimulation ? (
						<div className="space-y-1">
							<div className="text-[#8c8c8c] text-xs">
								[INFO] Simulation #{currentSimulation.id} started at{' '}
								{new Date(currentSimulation.createdAt).toLocaleString()}
							</div>
							<div className="text-[#8c8c8c] text-xs">
								[INFO] Task: {currentSimulation.task || 'No task specified'}
							</div>
							<div className="text-[#8c8c8c] text-xs">
								[INFO] Status: {currentSimulation.status}
							</div>
							<Separator className="my-2 bg-[#3e3e42]" />

							{logs.length > 0 ? (
								logs.map((log, index) => (
									<div key={index} className="py-1">
										<span className="text-[#8c8c8c]">[{new Date().toLocaleTimeString()}]</span>
										<span className="text-[#d4d4d4] ml-2">
											{typeof log === 'string' ? log : JSON.stringify(log)}
										</span>
									</div>
								))
							) : (
								<div className="text-[#8c8c8c] text-xs italic">
									Waiting for simulation output...
								</div>
							)}
						</div>
					) : (
						<div className="text-center py-8">
							<TerminalIcon size={24} className="mx-auto mb-2 text-[#8c8c8c]" />
							<p className="text-sm text-[#8c8c8c] font-sans">No active simulation</p>
							<p className="text-xs text-[#6a6a6a] font-sans">Start a simulation to see logs</p>
						</div>
					)}
				</div>
			</ScrollArea>
		</div>
	);
};

export const getLogsCount = (state?: SimulationSelect['state']): number => {
	const results = state?.results || [];
	return results.length;
};

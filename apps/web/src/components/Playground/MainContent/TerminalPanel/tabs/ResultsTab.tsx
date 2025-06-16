import React from 'react';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { DatabaseIcon } from 'lucide-react';
import { SimulationSelect } from '@/database/client/schema';
import { usePlaygroundStore } from '@/store/playground';

interface ResultsTabProps {
	state?: SimulationSelect['state'];
}

export const ResultsTab: React.FC<ResultsTabProps> = ({ state }) => {
	const currentSimulation = usePlaygroundStore.getState().getPinnedSimulation();
	const simulationResults = state?.results || [];

	return (
		<div className="h-full">
			<ScrollArea className="h-full">
				<div className="p-3 text-[#cccccc]">
					{currentSimulation && simulationResults ? (
						<div className="space-y-3">
							{/* Simulation State Display */}
							<div className="bg-[#2d2d30] rounded p-3 border border-[#3e3e42]">
								<h4 className="text-xs font-medium mb-2 text-[#8c8c8c] uppercase tracking-wide">
									Raw State Data
								</h4>
								<pre className="text-xs font-mono bg-[#1e1e1e] p-3 rounded border border-[#3e3e42] overflow-auto max-h-96 text-[#d4d4d4]">
									{JSON.stringify(simulationResults, null, 2)}
								</pre>
							</div>

							{/* Parse and display structured data if available */}
							{simulationResults && typeof simulationResults === 'object' && (
								<div className="space-y-2">
									{Object.entries(simulationResults).map(([key, value], index) => (
										<div key={index} className="bg-[#2d2d30] rounded p-3 border border-[#3e3e42]">
											<h4 className="text-xs font-medium mb-2 capitalize text-[#58a6ff]">
												{key.replace(/([A-Z])/g, ' $1').trim()}
											</h4>
											<div className="text-xs">
												{typeof value === 'object' ? (
													<pre className="font-mono bg-[#1e1e1e] p-2 rounded border border-[#3e3e42] overflow-auto text-[#d4d4d4]">
														{JSON.stringify(value, null, 2)}
													</pre>
												) : (
													<p className="break-words text-[#cccccc]">{String(value)}</p>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					) : (
						<div className="text-center py-8">
							<DatabaseIcon size={24} className="mx-auto mb-2 text-[#8c8c8c]" />
							<p className="text-sm text-[#8c8c8c]">No results available</p>
							<p className="text-xs text-[#6a6a6a]">
								{currentSimulation
									? 'Simulation has not produced results yet'
									: 'No simulation selected'}
							</p>
						</div>
					)}
				</div>
			</ScrollArea>
		</div>
	);
};

export const getResultsCount = (state?: SimulationSelect['state']): number => {
	const results = state?.results || [];
	return results.length;
};

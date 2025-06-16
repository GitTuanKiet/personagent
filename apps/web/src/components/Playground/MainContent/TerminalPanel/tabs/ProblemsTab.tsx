import React from 'react';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { BugIcon } from 'lucide-react';
import { SimulationSelect } from '@/database/client/schema';

interface ProblemsTabProps {
	state?: SimulationSelect['state'];
}

export const ProblemsTab: React.FC<ProblemsTabProps> = ({ state }) => {
	const results = state?.results || [];
	const hasErrors = results.some((result) => result.result?.includes('error'));
	const logs = results.filter((result) => result.result?.includes('error'));

	return (
		<div className="h-full">
			<ScrollArea className="h-full">
				<div className="p-3 text-[#cccccc]">
					{hasErrors ? (
						<div className="space-y-2">
							{logs
								.filter((log) => log.result?.includes('error'))
								.map((log, index) => (
									<div
										key={index}
										className="flex items-start gap-3 p-2 hover:bg-[#2d2d30] rounded"
									>
										<div className="flex items-center gap-2 min-w-0 flex-1">
											<div className="w-4 h-4 rounded-full bg-[#f85149] flex items-center justify-center">
												<span className="text-white text-xs">E</span>
											</div>
											<div className="min-w-0 flex-1">
												<div className="text-sm text-[#f85149] font-mono">
													Error in simulation step {index + 1}
												</div>
												<div className="text-xs text-[#8c8c8c] font-mono mt-1">
													{typeof log === 'string' ? log : JSON.stringify(log, null, 2)}
												</div>
											</div>
										</div>
										<div className="text-xs text-[#8c8c8c]">Line {index + 1}</div>
									</div>
								))}
						</div>
					) : (
						<div className="text-center py-8">
							<BugIcon size={24} className="mx-auto mb-2 text-[#8c8c8c]" />
							<p className="text-sm text-[#8c8c8c]">No problems detected</p>
							<p className="text-xs text-[#6a6a6a]">All systems running smoothly</p>
						</div>
					)}
				</div>
			</ScrollArea>
		</div>
	);
};

export const getProblemsCount = (state?: SimulationSelect['state']): number => {
	const results = state?.results || [];
	return results.filter((result) => result.result?.includes('error')).length;
};

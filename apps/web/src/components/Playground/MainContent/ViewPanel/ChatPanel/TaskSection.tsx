import React, { memo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@workspace/ui/components/avatar';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Badge } from '@workspace/ui/components/badge';
import {
	PlayIcon,
	ClockIcon,
	SparklesIcon,
	RocketIcon,
	StopCircleIcon,
	CheckCircleIcon,
	XCircleIcon,
} from 'lucide-react';
import { usePlaygroundStore } from '@/store/playground';
import type { SimulationSelect } from '@/database/client/schema';

export interface TaskDisplayProps {
	simulation?: SimulationSelect | null;
}

export const TaskSection: React.FC<TaskDisplayProps> = memo(({ simulation }) => {
	const router = useRouter();
	const [isFocused, setIsFocused] = useState(false);
	const {
		taskInput,
		setTaskInput,
		runSimulation,
		stopSimulation,
		canStartSimulation,
		runningSimulationId,
	} = usePlaygroundStore();

	const isRunningSimulation = runningSimulationId !== null;

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			if (taskInput.trim() && !isRunningSimulation) {
				runSimulation((id) => router.push(`/playground/${id}`));
			}
		}
	};

	const handleRunClick = () => {
		runSimulation((id) => router.push(`/playground/${id}`));
	};

	const formatTimeAgo = (createdAt: string | Date) => {
		const now = new Date();
		const created = new Date(createdAt);
		const diffInSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);

		if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
		if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
		if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
		return created.toLocaleDateString();
	};

	// If simulation exists, show enhanced TaskDisplay
	if (simulation) {
		const isActive = simulation.status === 'running';
		const isCompleted = simulation.status === 'completed';
		const isFailed = simulation.status === 'failed';
		const canStop = isActive && isRunningSimulation;

		const getStatusConfig = () => {
			if (isActive) {
				return {
					badge: 'Running',
					badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
					avatarClass: 'border-emerald-200 bg-gradient-to-br from-emerald-500 to-teal-600',
					containerClass:
						'border-emerald-200/50 bg-gradient-to-br from-emerald-50/50 to-teal-50/30',
					dotClass: 'bg-emerald-500 animate-pulse',
					icon: <RocketIcon size={16} />,
				};
			}
			if (isCompleted) {
				return {
					badge: 'Completed',
					badgeClass: 'bg-indigo-100 text-indigo-700 border-indigo-200',
					avatarClass: 'border-indigo-200 bg-gradient-to-br from-indigo-500 to-purple-600',
					containerClass:
						'border-indigo-200/50 bg-gradient-to-br from-indigo-50/50 to-purple-50/30',
					dotClass: 'bg-indigo-500',
					icon: <CheckCircleIcon size={16} />,
				};
			}
			if (isFailed) {
				return {
					badge: 'Failed',
					badgeClass: 'bg-red-100 text-red-700 border-red-200',
					avatarClass: 'border-red-200 bg-gradient-to-br from-red-500 to-pink-600',
					containerClass: 'border-red-200/50 bg-gradient-to-br from-red-50/50 to-pink-50/30',
					dotClass: 'bg-red-500',
					icon: <XCircleIcon size={16} />,
				};
			}
			return {
				badge: 'Stopped',
				badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
				avatarClass: 'border-slate-200 bg-gradient-to-br from-slate-400 to-slate-600',
				containerClass: 'border-slate-200/50 bg-gradient-to-br from-slate-50/50 to-gray-50/30',
				dotClass: 'bg-slate-400',
				icon: <SparklesIcon size={16} />,
			};
		};

		const statusConfig = getStatusConfig();

		return (
			<div className="p-6 bg-white border-b border-slate-200">
				<div className="max-w-4xl mx-auto">
					<div className="group relative animate-in slide-in-from-left-2 duration-300">
						{/* Task Status Badge */}
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center gap-3">
								<Badge className={`text-xs font-medium border ${statusConfig.badgeClass}`}>
									<div className={`w-1.5 h-1.5 rounded-full mr-2 ${statusConfig.dotClass}`} />
									{statusConfig.badge}
								</Badge>
								<span className="text-xs text-slate-500 flex items-center gap-1.5">
									<ClockIcon size={12} />
									{formatTimeAgo(simulation.createdAt)}
								</span>
								<span className="text-xs text-slate-400">#{String(simulation.id)}</span>
							</div>

							{/* Stop Button for running simulations */}
							{canStop && (
								<Button
									onClick={stopSimulation}
									size="sm"
									variant="outline"
									className="h-7 px-3 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all"
								>
									<StopCircleIcon size={14} className="mr-1.5" />
									Stop
								</Button>
							)}
						</div>

						{/* Task Content */}
						<div className="flex gap-4 items-start">
							<Avatar className={`w-10 h-10 border-2 shadow-sm ${statusConfig.avatarClass}`}>
								<AvatarFallback
									className={statusConfig.avatarClass
										.replace('border-', '')
										.replace('w-10 h-10 ', '')}
								>
									{statusConfig.icon}
								</AvatarFallback>
							</Avatar>
							<div className="flex flex-col items-start flex-1">
								<div
									className={`border rounded-2xl px-5 py-4 w-full shadow-sm hover:shadow-md transition-all duration-200 group-hover:scale-[1.005] ${statusConfig.containerClass}`}
								>
									<div className="flex items-center gap-2 mb-2">
										<span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
											Task Objective
										</span>
									</div>
									<p className="text-sm leading-relaxed text-slate-800 font-medium whitespace-pre-wrap">
										{simulation.task}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// If no simulation, show enhanced TaskInput
	return (
		<div className="p-6 bg-white border-b border-slate-200">
			<div className="max-w-4xl mx-auto">
				<div className="animate-in slide-in-from-bottom-2 duration-300">
					{/* Header */}
					<div className="flex items-center gap-3 mb-4">
						<div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100">
							<RocketIcon size={16} className="text-indigo-600" />
						</div>
						<h3 className="text-lg font-semibold text-slate-800">Start New Simulation</h3>
						{isRunningSimulation && (
							<Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">
								<div className="w-1.5 h-1.5 rounded-full mr-1.5 bg-emerald-500 animate-pulse" />
								Running
							</Badge>
						)}
					</div>

					{/* Input Container */}
					<div
						className={`relative group border-2 rounded-2xl p-5 transition-all duration-200 ${
							isFocused
								? 'border-indigo-300 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 shadow-lg shadow-indigo-100/50'
								: 'border-slate-200 bg-slate-50/30 hover:border-slate-300 hover:shadow-sm hover:bg-slate-50/50'
						} ${isRunningSimulation ? 'opacity-75' : ''}`}
					>
						<div className="flex items-center gap-4">
							<Input
								value={taskInput}
								onChange={(e) => setTaskInput(e.target.value)}
								onFocus={() => setIsFocused(true)}
								onBlur={() => setIsFocused(false)}
								placeholder="Describe what you want the AI agent to do..."
								className={`flex-1 h-12 text-sm border-0 bg-transparent placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 ${
									isFocused ? 'placeholder:text-slate-500' : ''
								}`}
								onKeyDown={handleKeyDown}
								disabled={!canStartSimulation() || isRunningSimulation}
							/>

							{/* Submit Button */}
							<Button
								onClick={() => handleRunClick()}
								disabled={!canStartSimulation() || !taskInput.trim() || isRunningSimulation}
								size="sm"
								className={`group relative h-11 w-11 rounded-xl border-0 p-0 transition-all duration-300 flex-shrink-0 ${
									canStartSimulation() && taskInput.trim() && !isRunningSimulation
										? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-600 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-700 shadow-lg hover:shadow-xl hover:shadow-indigo-500/20 hover:scale-105'
										: 'bg-slate-200 hover:bg-slate-300'
								}`}
							>
								{/* Shimmer effect for active state */}
								{taskInput.trim() && !isRunningSimulation && (
									<div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
								)}

								{/* Icon container */}
								<div className="absolute inset-0 flex items-center justify-center">
									<PlayIcon
										size={18}
										className={`transition-all duration-200 ${
											taskInput.trim() && !isRunningSimulation
												? 'text-white drop-shadow-sm group-hover:scale-110 group-hover:translate-x-0.5'
												: 'text-slate-500'
										}`}
									/>
								</div>

								{/* Subtle pulse indicator when ready */}
								{taskInput.trim() && !isRunningSimulation && (
									<div className="absolute -inset-0.5 rounded-xl border border-indigo-400/30 opacity-60 animate-pulse" />
								)}
							</Button>
						</div>

						{/* Helper Text */}
						<div className="flex items-center justify-between mt-4">
							<p className="text-xs text-slate-500">
								{isRunningSimulation
									? 'Another simulation is currently running...'
									: taskInput.length > 0
										? `${taskInput.length} characters • Press Enter to run`
										: 'Example: "Navigate to GitHub and search for React components"'}
							</p>

							{taskInput.trim() && !isRunningSimulation && (
								<div className="flex items-center gap-1.5 text-xs text-indigo-600">
									<SparklesIcon size={12} />
									Ready to launch
								</div>
							)}
						</div>
					</div>

					{/* Quick Suggestions */}
					{!taskInput && !isRunningSimulation && (
						<div className="mt-4 animate-in fade-in duration-500 delay-200">
							<div className="flex flex-wrap gap-2">
								{[
									'Test checkout flow on e-commerce site',
									'Find and compare pricing pages',
									'Navigate and fill contact form',
								].map((suggestion, index) => (
									<Button
										key={index}
										variant="outline"
										size="sm"
										onClick={() => setTaskInput(suggestion)}
										className="text-xs h-8 px-3 border-slate-200 bg-white/60 text-slate-600 hover:border-slate-300 hover:text-slate-700 hover:bg-white hover:shadow-sm transition-all"
									>
										{suggestion}
									</Button>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
});

TaskSection.displayName = 'TaskSection';

export { TaskSection };

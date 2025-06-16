import React, { memo, useState } from 'react';
import { Avatar, AvatarFallback } from '@workspace/ui/components/avatar';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Badge } from '@workspace/ui/components/badge';
import { PlayIcon, ClockIcon, SparklesIcon, RocketIcon } from 'lucide-react';
import { usePlaygroundStore } from '@/store/playground';
import { TaskDisplayProps } from './types';

export const TaskSection: React.FC<TaskDisplayProps> = memo(({ simulation }) => {
	const [isFocused, setIsFocused] = useState(false);
	const {
		taskInput,
		setTaskInput,
		handleRunSimulation,
		// TODO: add handleStopSimulation
		handleStopSimulation,
		canStartSimulation,
	} = usePlaygroundStore();

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			if (taskInput.trim()) {
				handleRunSimulation();
			}
		}
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
		return (
			<div className="group relative animate-in slide-in-from-left-2 duration-300">
				{/* Task Status Badge */}
				<div className="flex items-center gap-2 mb-2">
					<Badge
						variant={simulation.status === 'running' ? 'default' : 'secondary'}
						className="text-xs font-medium"
					>
						<div
							className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
								simulation.status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
							}`}
						/>
						{simulation.status === 'running' ? 'Active' : 'Completed'}
					</Badge>
					<span className="text-xs text-muted-foreground flex items-center gap-1">
						<ClockIcon size={10} />
						{formatTimeAgo(simulation.createdAt)}
					</span>
				</div>

				{/* Task Content */}
				<div className="flex gap-3 items-start">
					<Avatar className="w-8 h-8 border-2 border-blue-200 shadow-sm">
						<AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-sm font-semibold">
							<SparklesIcon size={14} />
						</AvatarFallback>
					</Avatar>
					<div className="flex flex-col items-start flex-1">
						<div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/60 rounded-2xl px-4 py-3 max-w-lg break-words shadow-sm hover:shadow-md transition-all duration-200 group-hover:scale-[1.01]">
							<div className="flex items-center gap-2 mb-1">
								<span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
									Task
								</span>
								<div className="h-1 w-1 rounded-full bg-blue-400" />
								<span className="text-xs text-blue-500">#{String(simulation.id)}</span>
							</div>
							<p className="text-sm leading-relaxed text-slate-700 font-medium whitespace-pre-wrap">
								{simulation.task}
							</p>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// If no simulation, show enhanced TaskInput
	return (
		<div className="animate-in slide-in-from-bottom-2 duration-300">
			{/* Header */}
			<div className="flex items-center gap-2 mb-3">
				<RocketIcon size={16} className="text-slate-600" />
				<h3 className="text-sm font-semibold text-slate-700">Start New Simulation</h3>
			</div>

			{/* Input Container */}
			<div
				className={`relative group border-2 rounded-xl p-4 transition-all duration-200 ${
					isFocused
						? 'border-slate-300 bg-gradient-to-br from-gray-50 to-slate-50 shadow-lg shadow-slate-100/50'
						: 'border-gray-200 bg-gray-50/30 hover:border-gray-300 hover:shadow-sm hover:bg-gray-50/50'
				}`}
			>
				<div className="flex items-center gap-3">
					<Input
						value={taskInput}
						onChange={(e) => setTaskInput(e.target.value)}
						onFocus={() => setIsFocused(true)}
						onBlur={() => setIsFocused(false)}
						placeholder="✨ Describe what you want the AI agent to do..."
						className={`flex-1 h-12 text-sm border-0 bg-transparent placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 ${
							isFocused ? 'placeholder:text-slate-500' : ''
						}`}
						onKeyDown={handleKeyDown}
						disabled={!canStartSimulation()}
					/>

					{/* Submit Button */}
					<Button
						onClick={handleRunSimulation}
						disabled={!canStartSimulation() || !taskInput.trim()}
						size="sm"
						className={`group relative h-10 w-10 rounded-xl border-0 p-0 transition-all duration-300 flex-shrink-0 ${
							canStartSimulation() && taskInput.trim()
								? 'bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 hover:from-emerald-600 hover:via-blue-600 hover:to-purple-700 shadow-md hover:shadow-lg hover:shadow-blue-500/20 hover:scale-105'
								: 'bg-gradient-to-br from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400'
						}`}
					>
						{/* Shimmer effect for active state */}
						{taskInput.trim() && (
							<div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
						)}

						{/* Icon container */}
						<div className="absolute inset-0 flex items-center justify-center">
							<PlayIcon
								size={16}
								className={`transition-all duration-200 ${
									taskInput.trim()
										? 'text-white drop-shadow-sm group-hover:scale-105 group-hover:translate-x-0.5'
										: 'text-gray-500'
								}`}
							/>
						</div>

						{/* Subtle pulse indicator when ready */}
						{taskInput.trim() && (
							<div className="absolute -inset-0.5 rounded-xl border border-emerald-400/30 opacity-60 animate-pulse" />
						)}
					</Button>
				</div>

				{/* Helper Text */}
				<div className="flex items-center justify-between mt-3">
					<p className="text-xs text-gray-500">
						{taskInput.length > 0
							? `${taskInput.length} characters • Press Enter to run`
							: 'Example: "Navigate to GitHub and search for React components"'}
					</p>

					{taskInput.trim() && (
						<div className="flex items-center gap-1 text-xs text-slate-600">
							<SparklesIcon size={10} />
							Ready to launch
						</div>
					)}
				</div>
			</div>

			{/* Quick Suggestions */}
			{!taskInput && (
				<div className="mt-3 animate-in fade-in duration-500 delay-200">
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
								className="text-xs h-7 px-3 border-gray-200 bg-white/60 text-gray-500 hover:border-gray-300 hover:text-slate-600 hover:bg-white hover:shadow-sm transition-all"
							>
								{suggestion}
							</Button>
						))}
					</div>
				</div>
			)}
		</div>
	);
});

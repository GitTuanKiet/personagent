import { ReactNode, FC } from 'react';
import { Progress } from '@workspace/ui/components/progress';

export interface StageObjectItem {
	icon?: ReactNode;
	text: string;
}
export type StageItem = string | StageObjectItem;

interface InitProgressProps {
	activeStage: number;
	stages: StageItem[];
}

export const InitProgress: FC<InitProgressProps> = ({ activeStage, stages }) => {
	const stage = activeStage >= 0 && activeStage < stages.length ? stages[activeStage] : undefined;
	const { icon, text }: StageObjectItem =
		typeof stage === 'string' ? { text: stage ?? '' } : (stage ?? { text: '' });
	const percent = Math.round(((activeStage + 1) / stages.length) * 100);

	return (
		<div className="flex items-center justify-center p-8 min-w-60">
			<div className="flex flex-col items-center gap-2">
				<div className="relative w-16 h-16 mb-2">
					{/* Spinner */}
					<svg
						width="64"
						height="64"
						viewBox="0 0 64 64"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className="absolute top-0 left-0 animate-spin"
					>
						<circle
							cx="32"
							cy="32"
							r="28"
							stroke="#6366F1"
							strokeWidth="6"
							strokeDasharray="176"
							strokeDashoffset="120"
							strokeLinecap="round"
							opacity="0.25"
						/>
						<circle
							cx="32"
							cy="32"
							r="28"
							stroke="#6366F1"
							strokeWidth="6"
							strokeDasharray="88"
							strokeDashoffset="20"
							strokeLinecap="round"
						/>
					</svg>
					{/* Icon */}
					{icon && (
						<span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl flex items-center justify-center">
							{icon}
						</span>
					)}
				</div>
				{text && <span className="text-indigo-500 font-semibold text-lg mb-1">{text}</span>}
				<Progress value={percent} />
				<span className="text-slate-500 font-medium text-base">{percent}%</span>
			</div>
		</div>
	);
};

export default InitProgress;

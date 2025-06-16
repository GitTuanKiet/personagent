import { cn } from '@workspace/ui/lib/utils';
import { Skeleton } from '@workspace/ui/components/skeleton';

interface SkeletonLoadingProps {
	className?: string;
	lines?: number;
	height?: string;
}

export function SkeletonLoading({ className, lines = 3, height = 'h-4' }: SkeletonLoadingProps) {
	return (
		<div className={cn('space-y-3', className)}>
			{Array.from({ length: lines }).map((_, index) => (
				<Skeleton key={index} className={cn(height, index === lines - 1 ? 'w-3/4' : 'w-full')} />
			))}
		</div>
	);
}

export default SkeletonLoading;

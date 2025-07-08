import { cn } from '@workspace/ui/lib/utils';

export function TighterText({
	className,
	children,
}: {
	className?: string;
	children: React.ReactNode;
}) {
	return <span className={cn('tracking-tighter', className)}>{children}</span>;
}

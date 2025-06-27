import { LoaderCircle } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { Label } from '@workspace/ui/components/label';

interface CircleLoadingProps {
	size?: 'small' | 'medium' | 'large';
	className?: string;
	color?: string;
	text?: string;
	showText?: boolean;
	fullScreen?: boolean;
}

export function CircleLoading({
	size = 'large',
	className,
	color = 'currentColor',
	text = 'Loading',
	showText = true,
	fullScreen = false,
}: CircleLoadingProps) {
	// Convert size prop to actual number
	const getIconSize = () => {
		switch (size) {
			case 'small':
				return 16;
			case 'medium':
				return 24;
			case 'large':
				return 32;
			default:
				return 24;
		}
	};

	const content = (
		<div className="flex items-center gap-2">
			<div>
				<LoaderCircle
					size={getIconSize()}
					color={color}
					className={cn('animate-spin', className)}
				/>
			</div>
			{showText && <Label className="text-muted-foreground tracking-wider">{text}</Label>}
		</div>
	);

	if (fullScreen) {
		return <div className="h-full w-full flex items-center justify-center">{content}</div>;
	}

	return content;
}

export default CircleLoading;

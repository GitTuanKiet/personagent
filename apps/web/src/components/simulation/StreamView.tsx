import React, { useEffect, useRef, useState } from 'react';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import {
	ExpandIcon,
	ShrinkIcon,
	MonitorIcon,
	PlusIcon,
	MinusIcon,
	Maximize2Icon,
	Minimize2Icon,
} from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { STREAM_CONFIG } from './constants';

interface StreamViewProps {
	streamUrl?: string;
	isConnected?: boolean;
	expanded: boolean;
	onToggleExpand: () => void;
}

export const StreamView: React.FC<StreamViewProps> = ({
	streamUrl,
	isConnected: externalConnected = false,
	expanded,
	onToggleExpand,
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [frameSrc, setFrameSrc] = useState<string | null>(null);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const [zoomLevel, setZoomLevel] = useState<number>(1);
	const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
	const [streamEnded, setStreamEnded] = useState<boolean>(false);

	// track consecutive errors to stop polling when stream ends
	const errorCountRef = useRef(0);

	// Start interval to refresh every 1s when streamUrl available
	useEffect(() => {
		if (!streamUrl) return;

		const interval = setInterval(() => {
			setFrameSrc(`${streamUrl}?t=${Date.now()}`);
		}, 1000);

		return () => clearInterval(interval);
	}, [streamUrl]);

	useEffect(() => {
		// Clean existing interval on unmount or when streamUrl changes
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}

		if (!streamUrl) {
			setFrameSrc(null);
			return;
		}

		// Build proxied URL through api route to handle CORS/local mapping
		const proxiedBase = `/api/stream?streamUrl=${encodeURIComponent(streamUrl)}`;

		// Function to update image src with cache-busting param
		const updateFrame = () => {
			// Stop polling if too many consecutive errors
			if (errorCountRef.current >= 5) {
				return;
			}
			setFrameSrc(`${proxiedBase}&t=${Date.now()}`);
		};

		// Initial fetch
		updateFrame();

		// Polling every 1s
		intervalRef.current = setInterval(updateFrame, 1000);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [streamUrl]);

	return (
		<div
			className={cn(
				'flex items-center gap-4 px-4 py-2 h-full transition-all overflow-hidden',
				expanded ? 'bg-background' : 'bg-muted/30',
			)}
			style={{
				minHeight: expanded ? 320 : 200,
			}}
		>
			<div className="flex-1 flex flex-col items-center justify-center h-full">
				{frameSrc ? (
					<img
						src={frameSrc}
						alt="Live stream frame"
						className={cn(
							'rounded-lg border shadow max-w-full object-contain',
							expanded ? 'h-full' : 'h-48',
						)}
						style={{ background: '#000' }}
						onLoad={() => {
							errorCountRef.current = 0; // reset on successful load
						}}
						onError={() => {
							errorCountRef.current += 1;
							// After 5 consecutive errors, stop polling
							if (errorCountRef.current >= 5) {
								if (intervalRef.current) {
									clearInterval(intervalRef.current);
									intervalRef.current = null;
								}
								setFrameSrc(null);
							}
						}}
					/>
				) : (
					<div className="text-muted-foreground italic py-8">Waiting for frames...</div>
				)}
			</div>
			<div className="flex flex-col items-center justify-between h-full">
				<Button
					size="icon"
					variant="ghost"
					onClick={onToggleExpand}
					aria-label={expanded ? 'Thu nhỏ' : 'Mở rộng'}
					className="mb-2"
				>
					{expanded ? <ShrinkIcon className="w-5 h-5" /> : <ExpandIcon className="w-5 h-5" />}
				</Button>
			</div>
		</div>
	);
};

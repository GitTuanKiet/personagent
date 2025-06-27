'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import {
	MonitorIcon,
	WifiIcon,
	WifiOffIcon,
	LoaderIcon,
	ExpandIcon,
	ShrinkIcon,
	RefreshCwIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@workspace/ui/lib/utils';

export interface StreamViewProps {
	streamUrl?: string;
	isConnected?: boolean;
	expanded?: boolean;
	onToggleExpand?: () => void;
	className?: string;
}

export function StreamView({
	streamUrl,
	isConnected = false,
	expanded = false,
	onToggleExpand,
	className = '',
}: StreamViewProps) {
	const [connectionState, setConnectionState] = useState<
		'disconnected' | 'connecting' | 'connected'
	>('disconnected');
	const [lastFrame, setLastFrame] = useState<string | null>(null);
	const [frameCount, setFrameCount] = useState(0);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const wsRef = useRef<WebSocket | null>(null);

	// Initialize WebSocket connection
	useEffect(() => {
		if (!streamUrl || !isConnected) {
			setConnectionState('disconnected');
			return;
		}

		setConnectionState('connecting');

		// Simulate connection (replace with actual WebSocket)
		const timer = setTimeout(() => {
			setConnectionState('connected');

			// Simulate frames
			const frameInterval = setInterval(() => {
				setFrameCount((prev) => prev + 1);
				setLastFrame(`frame-${Date.now()}`);
			}, 100);

			return () => clearInterval(frameInterval);
		}, 1500);

		return () => {
			clearTimeout(timer);
			if (wsRef.current) {
				wsRef.current.close();
			}
		};
	}, [streamUrl, isConnected]);

	const handleReconnect = () => {
		setConnectionState('connecting');
		setFrameCount(0);

		setTimeout(() => {
			setConnectionState('connected');
		}, 1000);
	};

	const getConnectionColor = () => {
		switch (connectionState) {
			case 'connected':
				return 'text-green-500';
			case 'connecting':
				return 'text-yellow-500';
			default:
				return 'text-gray-400';
		}
	};

	const getConnectionIcon = () => {
		switch (connectionState) {
			case 'connected':
				return <WifiIcon size={16} className="text-green-500" />;
			case 'connecting':
				return <LoaderIcon size={16} className="text-yellow-500 animate-spin" />;
			default:
				return <WifiOffIcon size={16} className="text-gray-400" />;
		}
	};

	return (
		<div className={cn('flex flex-col h-full bg-background', className)}>
			{/* Stream Header */}
			<div className="flex items-center justify-between p-3 border-b bg-muted/20">
				<div className="flex items-center gap-2">
					<MonitorIcon size={16} className="text-muted-foreground" />
					<span className="text-sm font-medium">Live Stream</span>
					<Badge variant="outline" className={cn('h-5 text-xs', getConnectionColor())}>
						{connectionState}
					</Badge>
				</div>

				<div className="flex items-center gap-1">
					{connectionState === 'disconnected' && (
						<Button
							variant="ghost"
							size="sm"
							onClick={handleReconnect}
							className="h-7 px-2 text-xs"
						>
							<RefreshCwIcon size={12} className="mr-1" />
							Connect
						</Button>
					)}

					{onToggleExpand && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onToggleExpand}
							className="h-7 px-2"
							title={expanded ? 'Shrink' : 'Expand'}
						>
							{expanded ? <ShrinkIcon size={12} /> : <ExpandIcon size={12} />}
						</Button>
					)}
				</div>
			</div>

			{/* Stream Content */}
			<div className="flex-1 relative overflow-hidden">
				<div className="h-full overflow-hidden">
					<AnimatePresence mode="wait">
						{connectionState === 'disconnected' && (
							<motion.div
								key="disconnected"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="absolute inset-0 flex flex-col items-center justify-center text-center p-6"
							>
								<div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
									<WifiOffIcon size={24} className="text-muted-foreground" />
								</div>
								<h3 className="font-medium mb-2">Stream Disconnected</h3>
								<p className="text-sm text-muted-foreground mb-4">
									Browser stream is not active. Start a simulation to view live interactions.
								</p>
								<Button variant="outline" size="sm" onClick={handleReconnect} className="h-8">
									<RefreshCwIcon size={14} className="mr-2" />
									Reconnect
								</Button>
							</motion.div>
						)}

						{connectionState === 'connecting' && (
							<motion.div
								key="connecting"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="absolute inset-0 flex flex-col items-center justify-center text-center p-6"
							>
								<div className="w-16 h-16 bg-blue-100 dark:bg-blue-950/20 rounded-full flex items-center justify-center mb-4">
									<LoaderIcon size={24} className="text-blue-500 animate-spin" />
								</div>
								<h3 className="font-medium mb-2">Connecting...</h3>
								<p className="text-sm text-muted-foreground">
									Establishing connection to browser stream
								</p>
							</motion.div>
						)}

						{connectionState === 'connected' && (
							<motion.div
								key="connected"
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.95 }}
								className="absolute inset-0"
							>
								{/* Stream Canvas */}
								<div className="relative w-full h-full bg-black rounded-md overflow-hidden">
									<canvas
										ref={canvasRef}
										className="w-full h-full object-contain"
										style={{ imageRendering: 'pixelated' }}
									/>

									{/* Placeholder for actual stream */}
									<div className="absolute inset-0 flex items-center justify-center">
										<div className="text-center text-white/70">
											<MonitorIcon size={48} className="mx-auto mb-4 opacity-50" />
											<p className="text-sm">Browser Stream Active</p>
											<p className="text-xs mt-1">Frame #{frameCount}</p>
										</div>
									</div>

									{/* Stream Status Overlay */}
									<div className="absolute top-3 left-3 flex items-center gap-2">
										{getConnectionIcon()}
										<span className="text-white text-xs bg-black/50 px-2 py-1 rounded">Live</span>
									</div>

									{/* Frame Counter */}
									<div className="absolute bottom-3 right-3 text-white text-xs bg-black/50 px-2 py-1 rounded">
										{frameCount} frames
									</div>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>

			{/* Stream Footer */}
			{connectionState === 'connected' && (
				<div className="h-8 border-t bg-muted/30 flex items-center justify-between px-3 text-xs text-muted-foreground">
					<div className="flex items-center gap-3">
						<span>Stream: Active</span>
						<span>•</span>
						<span>Quality: Auto</span>
					</div>
					<span>{frameCount} frames received</span>
				</div>
			)}
		</div>
	);
}

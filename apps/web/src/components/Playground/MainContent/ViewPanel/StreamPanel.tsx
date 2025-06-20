'use client';

import { useState, useRef, useEffect } from 'react';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { MonitorIcon, EyeIcon, MaximizeIcon } from 'lucide-react';
import { usePlaygroundStore } from '@/store/playground';

export default function StreamPanel() {
	const { getPinnedApplication } = usePlaygroundStore();
	const currentSimulation = usePlaygroundStore((state) => state.currentSimulation);
	const pinnedApplication = getPinnedApplication();
	const isRunning = currentSimulation?.status === 'running';

	const streamUrl =
		pinnedApplication &&
		`/api/stream/${pinnedApplication.fingerprint + '_' + pinnedApplication.id}`;

	const [streamFailed, setStreamFailed] = useState(!streamUrl);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const streamContainerRef = useRef<HTMLDivElement>(null);

	const handleStreamError = () => {
		setStreamFailed(true);
	};

	const handleStreamLoad = () => {
		setStreamFailed(false);
	};

	const handleFullscreen = async () => {
		if (!streamContainerRef.current) return;

		try {
			if (!isFullscreen) {
				// Enter fullscreen
				if (streamContainerRef.current.requestFullscreen) {
					await streamContainerRef.current.requestFullscreen();
				} else if ((streamContainerRef.current as any).webkitRequestFullscreen) {
					await (streamContainerRef.current as any).webkitRequestFullscreen();
				} else if ((streamContainerRef.current as any).msRequestFullscreen) {
					await (streamContainerRef.current as any).msRequestFullscreen();
				}
			} else {
				// Exit fullscreen
				if (document.exitFullscreen) {
					await document.exitFullscreen();
				} else if ((document as any).webkitExitFullscreen) {
					await (document as any).webkitExitFullscreen();
				} else if ((document as any).msExitFullscreen) {
					await (document as any).msExitFullscreen();
				}
			}
		} catch (error) {
			console.error('Fullscreen error:', error);
		}
	};

	// Listen for fullscreen changes
	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(!!document.fullscreenElement);
		};

		document.addEventListener('fullscreenchange', handleFullscreenChange);
		document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
		document.addEventListener('msfullscreenchange', handleFullscreenChange);

		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
			document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
			document.removeEventListener('msfullscreenchange', handleFullscreenChange);
		};
	}, []);

	return (
		<div className={`flex flex-col h-full`}>
			<div className="p-4 border-b">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<MonitorIcon size={16} />
						<span className="font-medium">Live Browser View</span>
						{isRunning && <EyeIcon className="text-green-500" size={12} />}
					</div>
					<div className="flex items-center gap-2">
						{currentSimulation && <Badge variant="secondary">#{currentSimulation.id}</Badge>}
						<div className="flex gap-1">
							<Button
								onClick={handleFullscreen}
								size="sm"
								variant="outline"
								className="gap-2"
								title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
							>
								<MaximizeIcon size={12} />
							</Button>
						</div>
					</div>
				</div>
			</div>

			{/* Stream View */}
			<div
				ref={streamContainerRef}
				className={`flex-1 bg-black relative overflow-hidden cursor-pointer ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
			>
				{/* Always try to load stream image */}
				{streamUrl && (
					<img
						src={streamUrl}
						alt="Browser Agent Stream"
						className={`w-full h-full object-contain ${streamFailed ? 'hidden' : ''}`}
						onError={handleStreamError}
						onLoad={handleStreamLoad}
					/>
				)}

				{/* Fallback content when stream fails or returns non-image */}
				{streamFailed && (
					<div className="absolute inset-0 flex items-center justify-center text-white/60">
						<div className="text-center">
							<MonitorIcon size={48} className="mx-auto mb-2 opacity-50" />
							<p>Stream unavailable</p>
							<p className="text-xs mt-1">Browser stream is currently not accessible</p>
							<button
								className="mt-3 px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs transition-colors"
								onClick={(e) => {
									e.stopPropagation();
									setStreamFailed(false);
									// Force reload the image
									const img =
										e.currentTarget.parentNode?.parentNode?.parentNode?.querySelector('img');
									if (img) {
										img.src = streamUrl + '?t=' + Date.now();
									}
								}}
							>
								Retry
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

'use client';

import { ALL_MODEL_NAMES, DEFAULT_MODEL_CONFIG, DEFAULT_MODEL_NAME } from '@/lib/models';
import { useGraphContext } from '@/contexts/graph-context';
import type { CustomModelConfig } from '@/lib/models';
import React, { useEffect, useState } from 'react';
import { ContentComposerChatInterface } from './content-composer';
import { useThreadContext } from '@/contexts/thread-context';
import NoSSRWrapper from '../NoSSRWrapper';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@workspace/ui/components/resizable';
import { CHAT_COLLAPSED_QUERY_PARAM } from '@/constants';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArtifactRenderer } from '@/components/artifacts';
import { toast } from 'sonner';

// Canvas layout constants
const LAYOUT_QUERY_PARAM = 'layout';
const CONTROLS_COLLAPSED_QUERY_PARAM = 'controls_collapsed';

export function PlaygroundComponent() {
	const { graphData } = useGraphContext();
	const { setModelName, setModelConfig } = useThreadContext();
	const { chatStarted, setChatStarted } = graphData;
	const [chatCollapsed, setChatCollapsed] = useState(false);

	const [layout, setLayout] = useState<'split' | 'stacked'>('split');
	const [controlsCollapsed, setControlsCollapsed] = useState(false);

	const searchParams = useSearchParams();
	const router = useRouter();

	const chatCollapsedSearchParam = searchParams.get(CHAT_COLLAPSED_QUERY_PARAM);
	const layoutSearchParam = searchParams.get(LAYOUT_QUERY_PARAM);
	const controlsCollapsedSearchParam = searchParams.get(CONTROLS_COLLAPSED_QUERY_PARAM);

	useEffect(() => {
		try {
			if (chatCollapsedSearchParam) {
				setChatCollapsed(JSON.parse(chatCollapsedSearchParam));
			}
		} catch (e) {
			setChatCollapsed(false);
			const queryParams = new URLSearchParams(searchParams.toString());
			queryParams.delete(CHAT_COLLAPSED_QUERY_PARAM);
			router.replace(`?${queryParams.toString()}`, { scroll: false });
		}
	}, [chatCollapsedSearchParam]);

	useEffect(() => {
		try {
			if (layoutSearchParam && (layoutSearchParam === 'split' || layoutSearchParam === 'stacked')) {
				setLayout(layoutSearchParam);
			}
		} catch (e) {
			setLayout('split');
			const queryParams = new URLSearchParams(searchParams.toString());
			queryParams.delete(LAYOUT_QUERY_PARAM);
			router.replace(`?${queryParams.toString()}`, { scroll: false });
		}
	}, [layoutSearchParam]);

	useEffect(() => {
		try {
			if (controlsCollapsedSearchParam) {
				setControlsCollapsed(JSON.parse(controlsCollapsedSearchParam));
			}
		} catch (e) {
			setControlsCollapsed(false);
			const queryParams = new URLSearchParams(searchParams.toString());
			queryParams.delete(CONTROLS_COLLAPSED_QUERY_PARAM);
			router.replace(`?${queryParams.toString()}`, { scroll: false });
		}
	}, [controlsCollapsedSearchParam]);

	const updateQueryParam = (key: string, value: string) => {
		const queryParams = new URLSearchParams(searchParams.toString());
		queryParams.set(key, value);
		router.replace(`?${queryParams.toString()}`, { scroll: false });
	};

	const handlelayoutChange = (newLayout: 'split' | 'stacked') => {
		setLayout(newLayout);
		updateQueryParam(LAYOUT_QUERY_PARAM, newLayout);
	};

	const handleCanvasControlsToggle = (collapsed: boolean) => {
		setControlsCollapsed(collapsed);
		updateQueryParam(CONTROLS_COLLAPSED_QUERY_PARAM, JSON.stringify(collapsed));
	};

	// Handler for stopping simulation and clearing state
	const handleStopSimulation = () => {
		// Stop the current streaming operation
		graphData.setIsStreaming(false);
		// Optionally clear the simulation state
		// graphData.clearState();
		toast.info('Simulation stopped');
	};

	// Handler for pausing simulation (if supported by backend)
	const handlePauseSimulation = () => {
		// Note: Pause functionality might require additional backend support
		// For now, we just stop the streaming
		graphData.setIsStreaming(false);
		toast.info('Simulation paused');
	};

	return (
		<ResizablePanelGroup direction="horizontal" className="h-screen">
			{!chatStarted && (
				<NoSSRWrapper>
					<ContentComposerChatInterface
						chatCollapsed={chatCollapsed}
						setChatCollapsed={(c) => {
							setChatCollapsed(c);
							updateQueryParam(CHAT_COLLAPSED_QUERY_PARAM, JSON.stringify(c));
						}}
						switchSelectedThreadCallback={(thread) => {
							// Chat should only be "started" if there are messages present
							if (thread.values?.messages?.length) {
								setChatStarted(true);
								if (thread?.metadata?.customModelName) {
									setModelName(thread.metadata.customModelName as ALL_MODEL_NAMES);
								} else {
									setModelName(DEFAULT_MODEL_NAME);
								}

								if (thread?.metadata?.modelConfig) {
									setModelConfig(
										(thread?.metadata?.customModelName ?? DEFAULT_MODEL_NAME) as ALL_MODEL_NAMES,
										(thread.metadata?.modelConfig ?? DEFAULT_MODEL_CONFIG) as CustomModelConfig,
									);
								} else {
									setModelConfig(DEFAULT_MODEL_NAME, DEFAULT_MODEL_CONFIG);
								}
							} else {
								setChatStarted(false);
							}
						}}
						setChatStarted={setChatStarted}
						hasChatStarted={chatStarted}
					/>
				</NoSSRWrapper>
			)}
			{!chatCollapsed && chatStarted && (
				<ResizablePanel
					defaultSize={25}
					minSize={15}
					maxSize={50}
					className="transition-all duration-700 h-screen mr-auto bg-gray-50/70 shadow-inner-right"
					id="chat-panel-main"
					order={1}
				>
					<NoSSRWrapper>
						<ContentComposerChatInterface
							chatCollapsed={chatCollapsed}
							setChatCollapsed={(c) => {
								setChatCollapsed(c);
								updateQueryParam(CHAT_COLLAPSED_QUERY_PARAM, JSON.stringify(c));
							}}
							switchSelectedThreadCallback={(thread) => {
								// Chat should only be "started" if there are messages present
								if (thread.values?.messages?.length) {
									setChatStarted(true);
									if (thread?.metadata?.customModelName) {
										setModelName(thread.metadata.customModelName as ALL_MODEL_NAMES);
									} else {
										setModelName(DEFAULT_MODEL_NAME);
									}

									if (thread?.metadata?.modelConfig) {
										setModelConfig(
											(thread?.metadata?.customModelName ?? DEFAULT_MODEL_NAME) as ALL_MODEL_NAMES,
											(thread.metadata.modelConfig ?? DEFAULT_MODEL_CONFIG) as CustomModelConfig,
										);
									} else {
										setModelConfig(DEFAULT_MODEL_NAME, DEFAULT_MODEL_CONFIG);
									}
								} else {
									setChatStarted(false);
								}
							}}
							setChatStarted={setChatStarted}
							hasChatStarted={chatStarted}
						/>
					</NoSSRWrapper>
				</ResizablePanel>
			)}

			{chatStarted && (
				<>
					<ResizableHandle />
					<ResizablePanel
						defaultSize={chatCollapsed ? 100 : 75}
						maxSize={85}
						minSize={50}
						id="canvas-panel"
						order={2}
						className="flex flex-row w-full"
					>
						<div className="w-full ml-auto">
							<ArtifactRenderer
								// Enhanced props with external layout control
								layout={layout}
								onLayoutChange={handlelayoutChange}
								controlsCollapsed={controlsCollapsed}
								onToggleControls={handleCanvasControlsToggle}
								messages={graphData.messages}
								simulation={graphData.state}
								actions={graphData.state?.actions}
								isRunning={graphData.isStreaming}
								streamUrl={graphData.state?.streamUrl}
								onStart={async () => {
									try {
										// Start simulation with default parameters
										// For a full implementation, this should accept user-defined parameters
										// from the chat interface or a configuration panel
										await graphData.streamMessage({
											messages: [
												{
													role: 'human',
													content: 'Start simulation: Navigate and explore the application',
												},
											],
										});
										toast.success('Simulation started successfully');
									} catch (error) {
										console.error('Failed to start simulation:', error);
										toast.error('Failed to start simulation');
									}
								}}
								onStop={handleStopSimulation}
								onPause={handlePauseSimulation}
							/>
						</div>
					</ResizablePanel>
				</>
			)}
		</ResizablePanelGroup>
	);
}

export const Playground = React.memo(PlaygroundComponent);
export * from './loading';

'use client';

import { useGraphContext } from '@/contexts/graph-context';
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
import { SimulationRenderer } from '@/components/simulation';
import { toast } from 'sonner';
import { Button } from '@workspace/ui/components/button';

export function PlaygroundComponent() {
	const { graphData } = useGraphContext();
	const { chatStarted, setChatStarted } = graphData;

	const [chatCollapsed, setChatCollapsed] = useState(false);

	const searchParams = useSearchParams();
	const router = useRouter();

	const chatCollapsedSearchParam = searchParams.get(CHAT_COLLAPSED_QUERY_PARAM);

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

	const updateQueryParam = (key: string, value: string) => {
		const queryParams = new URLSearchParams(searchParams.toString());
		queryParams.set(key, value);
		router.replace(`?${queryParams.toString()}`, { scroll: false });
	};

	const handleStartSimulation = () => {
		toast.info('Simulation started');
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
							if (thread.values?.messages?.length) {
								setChatStarted(true);
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
								if (thread.values?.messages?.length) {
									setChatStarted(true);
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
					{!chatCollapsed && <ResizableHandle />}
					<ResizablePanel
						defaultSize={chatCollapsed ? 100 : 75}
						maxSize={85}
						minSize={50}
						id="canvas-panel"
						order={2}
						className="flex flex-col h-full w-full"
					>
						<SimulationRenderer
							setChatCollapsed={(c: boolean) => {
								setChatCollapsed(c);
								updateQueryParam(CHAT_COLLAPSED_QUERY_PARAM, JSON.stringify(c));
							}}
							className="h-screen"
							state={graphData.state}
							isRunning={graphData.isStreaming}
							onStart={handleStartSimulation}
							onStop={handleStopSimulation}
							onPause={handlePauseSimulation}
						/>
					</ResizablePanel>
				</>
			)}
		</ResizablePanelGroup>
	);
}

export const Playground = React.memo(PlaygroundComponent);
export * from './loading';

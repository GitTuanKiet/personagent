'use client';

import React, { useState, useEffect } from 'react';
import { ArtifactRenderer } from './ArtifactRenderer';
import { Simulation, BrowserToolCall, UsabilityIssue } from '@/types';
import { Button } from '@workspace/ui/components/button';
import { Card } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@workspace/ui/components/resizable';
import { PlayIcon, PauseIcon, RefreshCwIcon, LayoutIcon } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

// Enhanced demo data with more realistic browser actions
const createDemoSimulation = (withIssues: boolean = true): Simulation => {
	const demoScripts: Record<number, BrowserToolCall[]> = {
		1: [
			{
				name: 'navigate_to_url',
				args: {
					url: 'https://demo-ecommerce.example.com',
					reason: 'Starting e-commerce usability test',
				},
				id: 'nav_1',
			},
			{
				name: 'take_screenshot',
				args: {
					reason: 'Initial page load - homepage view',
					filename: 'homepage_initial.png',
				},
				id: 'screenshot_1',
			},
		],
		2: [
			{
				name: 'click_element_by_index',
				args: {
					index: 0,
					selector: "button[data-testid='search-btn']",
					reason: 'Attempting to click search button',
				},
				id: 'click_1',
			},
			{
				name: 'wait',
				args: {
					duration: 500,
					reason: 'Wait for search interface to appear',
				},
				id: 'wait_1',
			},
		],
		3: [
			{
				name: 'fill_form',
				args: {
					selector: "input[name='search-query']",
					text: 'wireless headphones',
					reason: 'Search for popular product category',
				},
				id: 'fill_1',
			},
			{
				name: 'click_element_by_index',
				args: {
					index: 1,
					selector: "button[type='submit']",
					reason: 'Submit search query',
				},
				id: 'click_2',
			},
			{
				name: 'take_screenshot',
				args: {
					reason: 'Search results page loaded',
					filename: 'search_results.png',
				},
				id: 'screenshot_2',
			},
		],
		4: [
			{
				name: 'scroll_down',
				args: {
					pixels: 500,
					reason: 'Scroll to view more search results',
				},
				id: 'scroll_1',
			},
			{
				name: 'click_element_by_index',
				args: {
					index: 2,
					selector: '.product-card:first-child .add-to-cart',
					reason: 'Select first product from search results',
				},
				id: 'click_3',
			},
		],
		5: [
			{
				name: 'fill_form',
				args: {
					selector: "input[name='email']",
					text: 'test.user@example.com',
					reason: 'Enter email for checkout',
				},
				id: 'fill_2',
			},
			{
				name: 'fill_form',
				args: {
					selector: "input[name='password']",
					text: 'SecurePassword123!',
					reason: 'Enter password for login',
				},
				id: 'fill_3',
			},
			{
				name: 'click_element_by_index',
				args: {
					index: 3,
					selector: "button[data-testid='login-submit']",
					reason: 'Submit login form',
				},
				id: 'click_4',
			},
		],
		6: [
			{
				name: 'wait',
				args: {
					duration: 2000,
					reason: 'Wait for login process to complete',
				},
				id: 'wait_2',
			},
			{
				name: 'take_screenshot',
				args: {
					reason: 'Post-login state verification',
					filename: 'post_login.png',
				},
				id: 'screenshot_3',
			},
		],
		7: [
			{
				name: 'navigate_to_url',
				args: {
					url: 'https://demo-ecommerce.example.com/cart',
					reason: 'Navigate to shopping cart',
				},
				id: 'nav_2',
			},
			{
				name: 'click_element_by_index',
				args: {
					index: 4,
					selector: 'button.checkout-btn',
					reason: 'Proceed to checkout',
				},
				id: 'click_5',
			},
		],
		8: [
			{
				name: 'done',
				args: {
					reason: 'E-commerce user flow test completed successfully',
					success: true,
					completedTasks: [
						'Homepage navigation',
						'Product search',
						'User authentication',
						'Cart management',
						'Checkout initiation',
					],
				},
				id: 'done_1',
			},
		],
	};

	const demoUsabilityIssues: UsabilityIssue[] = withIssues
		? [
				{
					title: 'Poor Search Button Contrast',
					description: 'Search button has insufficient contrast ratio (2.1:1) against background',
					severity: 'high' as const,
					impact: 'major' as const,
					recommendation: 'Increase contrast ratio to at least 4.5:1 for WCAG AA compliance',
					context: 'During search interaction on homepage',
					category: 'accessibility' as const,
					element: "button[data-testid='search-btn']",
					stepIndex: 0,
				},
				{
					title: 'Missing Login Error Messages',
					description: 'Login form lacks proper error messaging for failed attempts',
					severity: 'medium' as const,
					impact: 'moderate' as const,
					recommendation: 'Add clear, descriptive error messages and field validation feedback',
					context: 'User authentication flow testing',
					category: 'forms' as const,
					element: "form[data-testid='login-form']",
					stepIndex: 4,
				},
				{
					title: 'Small Touch Targets on Mobile',
					description:
						'Product cards are too small on mobile viewport (less than 44px touch target)',
					severity: 'medium' as const,
					impact: 'moderate' as const,
					recommendation: 'Increase touch target size to minimum 44x44px for mobile accessibility',
					context: 'Search results interaction on mobile screen',
					category: 'accessibility' as const,
					element: '.product-card',
					stepIndex: 2,
				},
				{
					title: 'Checkout Button Placement Issue',
					description: 'Checkout button placement causes accidental clicks during scrolling',
					severity: 'low' as const,
					impact: 'minor' as const,
					recommendation: 'Add more spacing around checkout button or implement scroll protection',
					context: 'Cart page interaction',
					category: 'navigation' as const,
					element: 'button.checkout-btn',
					stepIndex: 6,
				},
				{
					title: 'Slow Page Load Performance',
					description: 'Homepage takes over 3 seconds to load initial content',
					severity: 'critical' as const,
					impact: 'blocker' as const,
					recommendation: 'Optimize images, implement lazy loading, and reduce bundle size',
					context: 'Initial page load performance',
					category: 'performance' as const,
					stepIndex: 0,
				},
			]
		: [];

	// Flatten scripts to actions for compatibility
	const allActions: BrowserToolCall[] = [];
	Object.values(demoScripts).forEach((stepActions) => {
		allActions.push(...stepActions);
	});

	return {
		messages: [],
		actions: allActions,
		scripts: demoScripts,
		nSteps: Object.keys(demoScripts).length,
		isDone: true,
		isSimulatedPrompt: false,
		streamUrl: 'ws://localhost:8080/stream',
		usabilityIssues: demoUsabilityIssues,
	};
};

// Separate Controls Component
interface DemoControlsProps {
	isRunning: boolean;
	includeIssues: boolean;
	layout: 'split' | 'stacked';
	simulationProgress: number;
	completedSteps: number;
	currentActions: BrowserToolCall[];
	totalSteps: number;
	totalActions: number;
	totalIssues: number;
	onStart: () => void;
	onPause: () => void;
	onReset: () => void;
	onToggleIssues: (include: boolean) => void;
	onToggleLayout: () => void;
}

function DemoControls({
	isRunning,
	includeIssues,
	layout,
	simulationProgress,
	completedSteps,
	currentActions,
	totalSteps,
	totalActions,
	totalIssues,
	onStart,
	onPause,
	onReset,
	onToggleIssues,
	onToggleLayout,
}: DemoControlsProps) {
	return (
		<div className="h-full border-r bg-muted/20 flex flex-col">
			{/* Header */}
			<div className="p-4 border-b">
				<h2 className="text-lg font-semibold mb-3">Canvas Demo</h2>

				{/* Progress Stats */}
				<div className="space-y-2 text-sm text-muted-foreground">
					<div className="flex justify-between">
						<span>Progress:</span>
						<span>{Math.round(simulationProgress)}%</span>
					</div>
					<div className="flex justify-between">
						<span>Steps:</span>
						<span>
							{completedSteps}/{totalSteps}
						</span>
					</div>
					<div className="flex justify-between">
						<span>Actions:</span>
						<span>
							{currentActions.length}/{totalActions}
						</span>
					</div>
					<div className="flex justify-between">
						<span>Issues:</span>
						<span>{totalIssues}</span>
					</div>
				</div>
			</div>

			{/* Controls */}
			<div className="p-4 space-y-4 flex-1">
				{/* Simulation Controls */}
				<div className="space-y-2">
					<h3 className="text-sm font-medium">Simulation</h3>
					<div className="space-y-2">
						{!isRunning ? (
							<Button
								onClick={onStart}
								size="sm"
								className="w-full gap-2"
								disabled={simulationProgress >= 100}
							>
								<PlayIcon size={14} />
								{simulationProgress >= 100 ? 'Completed' : 'Start'}
							</Button>
						) : (
							<Button onClick={onPause} size="sm" variant="secondary" className="w-full gap-2">
								<PauseIcon size={14} />
								Pause
							</Button>
						)}

						<Button onClick={onReset} size="sm" variant="outline" className="w-full gap-2">
							<RefreshCwIcon size={14} />
							Reset
						</Button>
					</div>
				</div>

				{/* Options */}
				<div className="space-y-2">
					<h3 className="text-sm font-medium">Options</h3>

					{/* Include Issues Toggle */}
					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							id="include-issues"
							checked={includeIssues}
							onChange={(e) => onToggleIssues(e.target.checked)}
							className="rounded"
						/>
						<label htmlFor="include-issues" className="text-sm">
							Include Issues
						</label>
					</div>

					{/* Layout Toggle */}
					{includeIssues && simulationProgress >= 100 && (
						<Button variant="outline" size="sm" onClick={onToggleLayout} className="w-full gap-2">
							<LayoutIcon size={14} />
							{layout === 'split' ? 'Switch to Stacked' : 'Switch to Split'}
						</Button>
					)}
				</div>

				{/* Status */}
				<div className="pt-4 mt-auto">
					<div className="text-xs text-muted-foreground text-center">
						{isRunning
							? 'Running simulation...'
							: simulationProgress >= 100
								? 'Simulation complete'
								: 'Ready to start'}
					</div>
				</div>
			</div>
		</div>
	);
}

// Query param constants for layout persistence
const DEMO_LAYOUT_QUERY_PARAM = 'demo_layout';
const DEMO_COLLAPSED_QUERY_PARAM = 'demo_collapsed';

export function ArtifactsDemo() {
	const [isRunning, setIsRunning] = useState(false);
	const [includeIssues, setIncludeIssues] = useState(true);
	const [layout, setLayout] = useState<'split' | 'stacked'>('split');
	const [simulationProgress, setSimulationProgress] = useState(0);
	const [completedSteps, setCompletedSteps] = useState(0);
	const [currentActions, setCurrentActions] = useState<BrowserToolCall[]>([]);
	const [controlsCollapsed, setControlsCollapsed] = useState(false);

	const searchParams = useSearchParams();
	const router = useRouter();

	// Persist layout state in URL
	useEffect(() => {
		const layoutParam = searchParams.get(DEMO_LAYOUT_QUERY_PARAM);
		const collapsedParam = searchParams.get(DEMO_COLLAPSED_QUERY_PARAM);

		if (layoutParam && (layoutParam === 'split' || layoutParam === 'stacked')) {
			setLayout(layoutParam);
		}

		if (collapsedParam) {
			try {
				setControlsCollapsed(JSON.parse(collapsedParam));
			} catch (e) {
				setControlsCollapsed(false);
			}
		}
	}, [searchParams]);

	const fullSimulation = createDemoSimulation(true);
	const cleanSimulation = createDemoSimulation(false);

	// Smart demo simulation based on state
	const getDemoSimulation = (): Simulation => {
		const baseSimulation = includeIssues ? fullSimulation : cleanSimulation;

		return {
			...baseSimulation,
			usabilityIssues: includeIssues ? fullSimulation.usabilityIssues : [],
			isDone: simulationProgress >= 100,
		};
	};

	const demoSimulation = getDemoSimulation();
	const totalSteps = Object.keys(fullSimulation.scripts || {}).length;
	const totalActions = Object.values(fullSimulation.scripts || {}).flat().length;

	// Simulate progressive execution
	useEffect(() => {
		if (!isRunning) return;

		const interval = setInterval(() => {
			setSimulationProgress((prev) => {
				if (prev >= 100) {
					setIsRunning(false);
					return 100;
				}
				return Math.min(prev + 8, 100);
			});

			setCompletedSteps((prev) => {
				const targetSteps = Math.floor((simulationProgress / 100) * totalSteps);
				return Math.min(targetSteps, totalSteps);
			});

			setCurrentActions((prev) => {
				const targetActionCount = Math.floor((simulationProgress / 100) * totalActions);
				return Object.values(fullSimulation.scripts || {})
					.flat()
					.slice(0, targetActionCount);
			});
		}, 300);

		return () => clearInterval(interval);
	}, [isRunning, simulationProgress, totalSteps, totalActions]);

	const handleStart = () => {
		setIsRunning(true);
	};

	const handlePause = () => {
		setIsRunning(false);
	};

	const handleReset = () => {
		setIsRunning(false);
		setSimulationProgress(0);
		setCompletedSteps(0);
		setCurrentActions([]);
	};

	const handleToggleLayout = () => {
		const newLayout = layout === 'split' ? 'stacked' : 'split';
		setLayout(newLayout);

		// Persist in URL
		const queryParams = new URLSearchParams(searchParams.toString());
		queryParams.set(DEMO_LAYOUT_QUERY_PARAM, newLayout);
		router.replace(`?${queryParams.toString()}`, { scroll: false });
	};

	const handleToggleControls = (collapsed: boolean) => {
		setControlsCollapsed(collapsed);

		// Persist in URL
		const queryParams = new URLSearchParams(searchParams.toString());
		queryParams.set(DEMO_COLLAPSED_QUERY_PARAM, JSON.stringify(collapsed));
		router.replace(`?${queryParams.toString()}`, { scroll: false });
	};

	return (
		<div className="h-screen flex bg-background">
			<ResizablePanelGroup direction="horizontal" className="h-screen">
				{/* Left Controls Panel */}
				{!controlsCollapsed && (
					<ResizablePanel
						defaultSize={25}
						minSize={15}
						maxSize={40}
						className="transition-all duration-300"
						id="demo-controls-panel"
						order={1}
					>
						<DemoControls
							isRunning={isRunning}
							includeIssues={includeIssues}
							layout={layout}
							simulationProgress={simulationProgress}
							completedSteps={completedSteps}
							currentActions={currentActions}
							totalSteps={totalSteps}
							totalActions={totalActions}
							totalIssues={demoSimulation.usabilityIssues.length}
							onStart={handleStart}
							onPause={handlePause}
							onReset={handleReset}
							onToggleIssues={setIncludeIssues}
							onToggleLayout={handleToggleLayout}
						/>
					</ResizablePanel>
				)}

				{!controlsCollapsed && <ResizableHandle />}

				{/* Right Canvas Panel */}
				<ResizablePanel
					defaultSize={controlsCollapsed ? 100 : 75}
					maxSize={85}
					minSize={50}
					id="demo-canvas-panel"
					order={2}
					className="flex flex-row w-full"
				>
					<div className="w-full">
						<ArtifactRenderer
							simulation={demoSimulation}
							actions={currentActions}
							isRunning={isRunning}
							streamUrl="wss://demo.example.com/stream"
							layout={layout}
							onLayoutChange={setLayout}
							controlsCollapsed={controlsCollapsed}
							onToggleControls={handleToggleControls}
						/>
					</div>
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}

export default ArtifactsDemo;

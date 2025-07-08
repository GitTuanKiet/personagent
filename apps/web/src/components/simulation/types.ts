import type { BrowserToolCall, ThreadState, UsabilityIssue } from '@/types';
import type { LucideIcon } from 'lucide-react';

export type CanvasState = 'empty' | 'executing' | 'issues-detected' | 'completed';
export type ActionSeverity = 'low' | 'medium' | 'high';
export type LayoutType = 'split' | 'stacked';
export type ExportFormat = 'json' | 'csv' | 'html';

export interface ActionConfig {
	color: string;
	icon: LucideIcon;
	severity: ActionSeverity;
	borderClass: string;
	description: string;
}

export interface SimulationRendererProps {
	state: ThreadState;
	isRunning?: boolean;
	onStart?: () => void;
	onStop?: () => void;
	onPause?: () => void;
	className?: string;
}

export interface SimulationToolbarProps {
	canvasState: CanvasState;
	isRunning: boolean;
	showStream: boolean;
	streamExpanded: boolean;
	streamUrl?: string;
	isDone: boolean;
	usabilityIssues: ThreadState['usabilityIssues'];
	onStart?: () => void;
	onStop?: () => void;
	onPause?: () => void;
	onToggleStream: () => void;
	onToggleStreamExpand: () => void;
	onExport: () => void;
}

export interface ActionRendererProps {
	scripts?: ThreadState['scripts'];
	canvasState: CanvasState;
	isCompact?: boolean;
	searchQuery?: string;
	selectedActionIndex?: number;
	onActionSelect?: (actionIndex: number) => void;
}

export interface ActionCardProps {
	action: BrowserToolCall;
	index: number;
	isSelected?: boolean;
	isCompact?: boolean;
	onClick?: () => void;
	searchQuery?: string;
}

export interface StreamViewProps {
	streamUrl?: string;
	isConnected?: boolean;
	expanded: boolean;
	onToggleExpand: () => void;
	onToggleFullscreen?: () => void;
	onZoom?: (level: number) => void;
	zoomLevel?: number;
	isFullscreen?: boolean;
}

export interface IssuePanelProps {
	issues: UsabilityIssue[];
	isExpanded: boolean;
	onToggleExpand: () => void;
	layout: LayoutType;
	onIssueSelect?: (issueId: string) => void;
	selectedIssueId?: string;
}

export interface ExportData {
	scripts: ThreadState['scripts'];
	usabilityIssues: ThreadState['usabilityIssues'];
	timestamp: string;
	metadata?: {
		totalActions: number;
		totalSteps: number;
		duration?: number;
		success?: boolean;
	};
}

export interface PlaybackControl {
	isPlaying: boolean;
	currentStep: number;
	speed: number; // 0.5x, 1x, 2x, etc.
	onPlay: () => void;
	onPause: () => void;
	onStop: () => void;
	onStepTo: (step: number) => void;
	onSpeedChange: (speed: number) => void;
}

export interface SearchOptions {
	query: string;
	caseSensitive: boolean;
	regex: boolean;
	scope: 'all' | 'actions' | 'arguments' | 'descriptions';
}

export interface KeyboardShortcutHandler {
	[key: string]: () => void;
}

import {
	MousePointerClickIcon,
	TypeIcon,
	NavigationIcon,
	EyeIcon,
	ClockIcon,
	CheckCircleIcon,
	ActivityIcon,
	RefreshCwIcon,
	CodeIcon,
	LayoutIcon,
	ZapIcon,
	ChevronDownIcon,
} from 'lucide-react';

export const ACTION_CONFIG = {
	click_element_by_index: {
		color: 'blue',
		icon: MousePointerClickIcon,
		severity: 'medium',
		borderClass: 'border-l-blue-500',
		description: 'Click element',
	},
	done: {
		color: 'emerald',
		icon: CheckCircleIcon,
		severity: 'low',
		borderClass: 'border-l-emerald-500',
		description: 'Task completed',
	},
	drag_drop: {
		color: 'purple',
		icon: MousePointerClickIcon,
		severity: 'medium',
		borderClass: 'border-l-purple-500',
		description: 'Drag and drop',
	},
	dropdown_options: {
		color: 'cyan',
		icon: ChevronDownIcon,
		severity: 'low',
		borderClass: 'border-l-cyan-500',
		description: 'Get dropdown options',
	},
	execute_javascript: {
		color: 'yellow',
		icon: CodeIcon,
		severity: 'high',
		borderClass: 'border-l-yellow-500',
		description: 'Execute JavaScript',
	},
	get_content: {
		color: 'cyan',
		icon: EyeIcon,
		severity: 'low',
		borderClass: 'border-l-cyan-500',
		description: 'Get page content',
	},
	input_text: {
		color: 'green',
		icon: TypeIcon,
		severity: 'medium',
		borderClass: 'border-l-green-500',
		description: 'Input text',
	},
	navigate_or_back: {
		color: 'purple',
		icon: NavigationIcon,
		severity: 'high',
		borderClass: 'border-l-purple-500',
		description: 'Navigate or go back',
	},
	scroll: {
		color: 'orange',
		icon: RefreshCwIcon,
		severity: 'low',
		borderClass: 'border-l-orange-500',
		description: 'Scroll page',
	},
	send_keys: {
		color: 'green',
		icon: TypeIcon,
		severity: 'medium',
		borderClass: 'border-l-green-500',
		description: 'Send keys',
	},
	tab_manager: {
		color: 'blue',
		icon: LayoutIcon,
		severity: 'high',
		borderClass: 'border-l-blue-500',
		description: 'Tab management',
	},
	wait: {
		color: 'yellow',
		icon: ClockIcon,
		severity: 'low',
		borderClass: 'border-l-yellow-500',
		description: 'Wait',
	},
	thinking: {
		color: 'gray',
		icon: ZapIcon,
		severity: 'low',
		borderClass: 'border-l-gray-500',
		description: 'Thinking',
	},
} as const;

export const DEFAULT_ACTION_CONFIG = {
	color: 'gray',
	icon: ActivityIcon,
	severity: 'low',
	borderClass: 'border-l-gray-500',
	description: 'Unknown action',
} as const;

export const SEVERITY_BORDERS = {
	high: 'border-l-4',
	medium: 'border-l-3',
	low: 'border-l-2',
} as const;

export const CANVAS_STATES = {
	EMPTY: 'empty',
	EXECUTING: 'executing',
	ISSUES_DETECTED: 'issues-detected',
	COMPLETED: 'completed',
} as const;

export const STREAM_CONFIG = {
	POLLING_INTERVAL: 1000,
	MAX_ERRORS: 5,
	DEFAULT_HEIGHT: {
		expanded: 320,
		collapsed: 200,
	},
} as const;

export const KEYBOARD_SHORTCUTS = {
	RUN: 'r',
	STOP: 'Escape',
	TOGGLE_STREAM: 's',
	EXPAND_STREAM: 'f',
	EXPORT: 'e',
	SEARCH: '/',
} as const;

export const ANIMATION_CONFIG = {
	DURATION: {
		FAST: 0.2,
		NORMAL: 0.3,
		SLOW: 0.5,
	},
	SPRING: {
		type: 'spring',
		stiffness: 300,
		damping: 30,
	},
} as const;

import type { SWRResponse } from 'swr';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface DialogStates {
	// Personalization
	personalizationDialog: boolean;

	// Creation dialogs
	createPersonaDialog: boolean;
	createApplicationDialog: boolean;
	editPersonaDialog: boolean;
	editApplicationDialog: boolean;

	// Confirmation dialogs
	confirmationDialog: boolean;
	deleteConfirmationDialog: boolean;
}

export interface PanelStates {
	// Current active panel mode
	currentPanelMode: 'chat' | 'stream' | 'flow';

	// Panel sizes (for resizable layout)
	resizablePanelSize: number; // Percentage (0-100)
}

export interface UIPreferences {
	// Theme settings
	theme: ThemeMode;

	// Layout preferences
	sidebarCollapsed: boolean;
	personaSidebarCollapsed: boolean;
	terminalPanelCollapsed: boolean;
	terminalPosition: 'bottom' | 'right';

	// Display settings
	fontSize: 'small' | 'medium' | 'large';
	density: 'compact' | 'comfortable' | 'spacious';
	animationsEnabled: boolean;

	// Developer preferences
	showDebugInfo: boolean;
	autoScrollLogs: boolean;
	logLevel: 'info' | 'debug' | 'error';

	// Dialog states
	dialogs: DialogStates;

	// Panel states
	panels: PanelStates;
}

export interface UserPreferences {
	// General settings
	language: string;
	timezone: string;

	// Notification settings
	enableNotifications: boolean;
	notificationSounds: boolean;

	// Simulation settings
	autoStartSimulations: boolean;
	maxConcurrentSimulations: number;
	defaultSimulationTimeout: number;
}

export interface APICredentials {
	openaiApiKey: string | null;
	anthropicApiKey: string | null;
	geminiApiKey: string | null;
}

export interface UserState {
	// Identity
	visitorId: string | null;

	// Preferences
	ui: UIPreferences;
	preferences: UserPreferences;

	// Loading state
	isLoading: boolean;
	error: string | null;
}

export interface UserActions {
	// Fingerprint
	initFingerprint: (params: { loadingStage: string }) => Promise<void>;
	useInitFingerprint: (params: { loadingStage: string }) => SWRResponse;
	// Theme
	setTheme: (theme: ThemeMode) => void;
	toggleTheme: () => void;

	// UI Preferences
	updateUIPreferences: (preferences: Partial<UIPreferences>) => void;
	resetUIPreferences: () => void;

	// User Preferences
	updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
	resetUserPreferences: () => void;

	// Dialog Management
	openDialog: (dialogKey: keyof DialogStates) => void;
	closeDialog: (dialogKey: keyof DialogStates) => void;
	toggleDialog: (dialogKey: keyof DialogStates) => void;
	closeAllDialogs: () => void;

	// Panel Management
	setPanelMode: (mode: 'chat' | 'stream' | 'flow') => void;
	togglePanelVisibility: (panelKey: keyof Omit<PanelStates, 'currentPanelMode'>) => void;

	// API Credentials Management
	setOpenAIApiKey: (apiKey: string, encrypt?: boolean) => Promise<void>;
	getOpenAIApiKey: () => Promise<string | null>;
	clearOpenAIApiKey: () => void;
	setAnthropicApiKey: (apiKey: string, encrypt?: boolean) => Promise<void>;
	getAnthropicApiKey: () => Promise<string | null>;
	clearAnthropicApiKey: () => void;
	setGroqApiKey: (apiKey: string, encrypt?: boolean) => Promise<void>;
	getGroqApiKey: () => Promise<string | null>;
	clearGroqApiKey: () => void;
	setCustomApiKey: (provider: string, apiKey: string, encrypt?: boolean) => Promise<void>;
	getCustomApiKey: (provider: string) => Promise<string | null>;
	clearCustomApiKey: (provider: string) => void;
	clearAllCredentials: () => void;

	// Settings persistence
	loadSettings: () => void;
	saveSettings: () => void;
	clearSettings: () => void;

	// Utils
	resetAll: () => void;
}

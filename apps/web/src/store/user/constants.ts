import type { UIPreferences, UserPreferences, DialogStates, PanelStates } from './types';

export const STORAGE_KEYS = {
	// Core user data
	FINGERPRINT: 'pag_browser_fingerprint',
	THEME: 'pag_theme',

	// Preferences
	UI_PREFERENCES: 'pag_ui_preferences',
	USER_PREFERENCES: 'pag_user_preferences',

	// UI State
	DIALOGS: 'pag_dialog_states',
	PANELS: 'pag_panel_states',

	// Notifications
	NOTIFICATIONS: 'pag_notifications',

	// AI Provider & Models
	API_CREDENTIALS: 'pag_api_credentials',
	SELECTED_AI_MODEL: 'pag_selected_ai_model',

	// Complete state backup
	COMPLETE_STATE: 'pag_complete_state',

	// Metadata
	LAST_SYNC: 'pag_last_sync',
	STORAGE_VERSION: 'pag_storage_version',
} as const;

export const DEFAULT_DIALOG_STATES: DialogStates = {
	// Personalization
	personalizationDialog: false,

	// Creation dialogs
	createPersonaDialog: false,
	createApplicationDialog: false,
	editPersonaDialog: false,
	editApplicationDialog: false,

	// Confirmation dialogs
	confirmationDialog: false,
	deleteConfirmationDialog: false,
};

export const DEFAULT_PANEL_STATES: PanelStates = {
	currentPanelMode: 'chat',
	resizablePanelSize: 25, // 25% for right panel
};

export const DEFAULT_UI_PREFERENCES: UIPreferences = {
	// Theme settings
	theme: 'system',

	// Layout preferences
	sidebarCollapsed: false,
	personaSidebarCollapsed: false,
	terminalPanelCollapsed: false,
	terminalPosition: 'bottom',

	// Display settings
	fontSize: 'medium',
	density: 'comfortable',
	animationsEnabled: true,

	// Developer preferences
	showDebugInfo: false,
	autoScrollLogs: true,
	logLevel: 'info',

	// Dialog states
	dialogs: DEFAULT_DIALOG_STATES,

	// Panel states
	panels: DEFAULT_PANEL_STATES,
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
	// General settings
	language: 'en',
	timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

	// Notification settings
	enableNotifications: true,
	notificationSounds: true,

	// Simulation settings
	autoStartSimulations: false,
	maxConcurrentSimulations: 3,
	defaultSimulationTimeout: 300000, // 5 minutes
};

export const THEME_COLORS = {
	light: {
		primary: 'hsl(222, 84%, 4.9%)',
		background: 'hsl(0, 0%, 100%)',
		foreground: 'hsl(222, 84%, 4.9%)',
	},
	dark: {
		primary: 'hsl(210, 40%, 98%)',
		background: 'hsl(222, 84%, 4.9%)',
		foreground: 'hsl(210, 40%, 98%)',
	},
} as const;

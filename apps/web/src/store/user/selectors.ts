import { useUserStore } from './index';
import type {
	ThemeMode,
	UIPreferences,
	UserPreferences,
	DialogStates,
	PanelStates,
	APICredentials,
} from './types';

// Theme Management Hook
export const useTheme = () => {
	const theme = useUserStore((state) => state.theme);
	const setTheme = useUserStore((state) => state.setTheme);
	const toggleTheme = useUserStore((state) => state.toggleTheme);

	return { theme, setTheme, toggleTheme };
};

// UI Preferences Hook
export const useUIPreferences = () => {
	const ui = useUserStore((state) => state.ui);
	const updateUIPreferences = useUserStore((state) => state.updateUIPreferences);
	const resetUIPreferences = useUserStore((state) => state.resetUIPreferences);

	return { ui, updateUIPreferences, resetUIPreferences };
};

// User Preferences Hook
export const useUserPreferences = () => {
	const preferences = useUserStore((state) => state.preferences);
	const updateUserPreferences = useUserStore((state) => state.updateUserPreferences);
	const resetUserPreferences = useUserStore((state) => state.resetUserPreferences);

	return { preferences, updateUserPreferences, resetUserPreferences };
};

// Loading state hooks
export const useUserLoading = () => {
	const isLoading = useUserStore((state) => state.isLoading);
	const error = useUserStore((state) => state.error);

	return { isLoading, error };
};

// Settings Management Hooks
export const useSettings = () => {
	const loadSettings = useUserStore((state) => state.loadSettings);
	const saveSettings = useUserStore((state) => state.saveSettings);
	const clearSettings = useUserStore((state) => state.clearSettings);
	const resetAll = useUserStore((state) => state.resetAll);

	return { loadSettings, saveSettings, clearSettings, resetAll };
};

// Density Hook
export const useDensity = () => {
	const density = useUserStore((state) => state.ui.density);
	const setDensity = (density: 'compact' | 'comfortable' | 'spacious') => {
		useUserStore.getState().updateUIPreferences({ density });
	};

	return { density, setDensity };
};

// Font Size Hook
export const useFontSize = () => {
	const fontSize = useUserStore((state) => state.ui.fontSize);
	const setFontSize = (fontSize: 'small' | 'medium' | 'large') => {
		useUserStore.getState().updateUIPreferences({ fontSize });
	};

	return { fontSize, setFontSize };
};

export const useAnimations = () => {
	const animationsEnabled = useUserStore((state) => state.ui.animationsEnabled);
	const setAnimations = (enabled: boolean) => {
		useUserStore.getState().updateUIPreferences({ animationsEnabled: enabled });
	};

	return { animationsEnabled, setAnimations };
};

// Developer preferences hooks
export const useDeveloperPreferences = () => {
	const { showDebugInfo, autoScrollLogs, logLevel } = useUserStore((state) => state.ui);

	const updateDeveloperPrefs = (
		prefs: Partial<Pick<UIPreferences, 'showDebugInfo' | 'autoScrollLogs' | 'logLevel'>>,
	) => {
		useUserStore.getState().updateUIPreferences(prefs);
	};

	return {
		showDebugInfo,
		autoScrollLogs,
		logLevel,
		updateDeveloperPrefs,
	};
};

// Notification preferences hooks
export const useNotificationPreferences = () => {
	const { enableNotifications, notificationSounds } = useUserStore((state) => state.preferences);

	const updateNotificationPrefs = (
		prefs: Partial<Pick<UserPreferences, 'enableNotifications' | 'notificationSounds'>>,
	) => {
		useUserStore.getState().updateUserPreferences(prefs);
	};

	return {
		enableNotifications,
		notificationSounds,
		updateNotificationPrefs,
	};
};

// Simulation preferences hooks
export const useSimulationPreferences = () => {
	const { autoStartSimulations, maxConcurrentSimulations, defaultSimulationTimeout } = useUserStore(
		(state) => state.preferences,
	);

	const updateSimulationPrefs = (
		prefs: Partial<
			Pick<
				UserPreferences,
				'autoStartSimulations' | 'maxConcurrentSimulations' | 'defaultSimulationTimeout'
			>
		>,
	) => {
		useUserStore.getState().updateUserPreferences(prefs);
	};

	return {
		autoStartSimulations,
		maxConcurrentSimulations,
		defaultSimulationTimeout,
		updateSimulationPrefs,
	};
};

// Dialog Management Hooks
export const useDialogs = () => {
	const dialogs = useUserStore((state) => state.dialogs);
	const openDialog = useUserStore((state) => state.openDialog);
	const closeDialog = useUserStore((state) => state.closeDialog);
	const toggleDialog = useUserStore((state) => state.toggleDialog);
	const closeAllDialogs = useUserStore((state) => state.closeAllDialogs);

	return {
		dialogs,
		openDialog,
		closeDialog,
		toggleDialog,
		closeAllDialogs,
	};
};

// Specific dialog hooks
export const usePersonalizationDialog = () => {
	const isOpen = useUserStore((state) => state.dialogs.personalizationDialog);
	const openDialog = () => useUserStore.getState().openDialog('personalizationDialog');
	const closeDialog = () => useUserStore.getState().closeDialog('personalizationDialog');
	const toggleDialog = () => useUserStore.getState().toggleDialog('personalizationDialog');

	return { isOpen, openDialog, closeDialog, toggleDialog };
};

export const useCreatePersonaDialog = () => {
	const isOpen = useUserStore((state) => state.dialogs.createPersonaDialog);
	const openDialog = () => useUserStore.getState().openDialog('createPersonaDialog');
	const closeDialog = () => useUserStore.getState().closeDialog('createPersonaDialog');

	return { isOpen, openDialog, closeDialog };
};

export const useEditPersonaDialog = () => {
	const isOpen = useUserStore((state) => state.dialogs.editPersonaDialog);
	const openDialog = () => useUserStore.getState().openDialog('editPersonaDialog');
	const closeDialog = () => useUserStore.getState().closeDialog('editPersonaDialog');

	return { isOpen, openDialog, closeDialog };
};

export const useCreateApplicationDialog = () => {
	const isOpen = useUserStore((state) => state.dialogs.createApplicationDialog);
	const openDialog = () => useUserStore.getState().openDialog('createApplicationDialog');
	const closeDialog = () => useUserStore.getState().closeDialog('createApplicationDialog');

	return { isOpen, openDialog, closeDialog };
};

export const useEditApplicationDialog = () => {
	const isOpen = useUserStore((state) => state.dialogs.editApplicationDialog);
	const openDialog = () => useUserStore.getState().openDialog('editApplicationDialog');
	const closeDialog = () => useUserStore.getState().closeDialog('editApplicationDialog');

	return { isOpen, openDialog, closeDialog };
};

// Panel mode hook
export const usePanelMode = () => {
	const currentMode = useUserStore((state) => state.panels.currentPanelMode);
	const setPanelMode = useUserStore((state) => state.setPanelMode);

	const cycleMode = () => {
		const modes: Array<'chat' | 'stream' | 'flow'> = ['chat', 'stream', 'flow'];
		const currentIndex = modes.indexOf(currentMode);
		const nextIndex = (currentIndex + 1) % modes.length;
		const nextMode = modes[nextIndex];
		if (nextMode) {
			setPanelMode(nextMode);
		}
	};

	const setChatMode = () => setPanelMode('chat');
	const setStreamMode = () => setPanelMode('stream');
	const setFlowMode = () => setPanelMode('flow');

	return {
		currentMode,
		setPanelMode,
		cycleMode,
		setChatMode,
		setStreamMode,
		setFlowMode,
		isChatMode: currentMode === 'chat',
		isStreamMode: currentMode === 'stream',
		isFlowMode: currentMode === 'flow',
	};
};

// Panel sizing hooks
export const usePanelSizing = () => {
	const { resizablePanelSize } = useUserStore((state) => state.panels);
	const setPanelSize = useUserStore((state) => state.setPanelSize);

	return {
		resizablePanelSize,
		setPanelSize,
	};
};

// Log Panel hooks
export const useLogPanel = () => {
	const { terminalPanelCollapsed } = useUserStore((state) => state.ui);
	const updateUIPreferences = useUserStore((state) => state.updateUIPreferences);

	const toggleLogPanel = () => {
		updateUIPreferences({ terminalPanelCollapsed: !terminalPanelCollapsed });
	};

	const showLogPanel = () => {
		updateUIPreferences({ terminalPanelCollapsed: false });
	};

	const hideLogPanel = () => {
		updateUIPreferences({ terminalPanelCollapsed: true });
	};

	return {
		terminalPanelCollapsed,
		isLogPanelVisible: !terminalPanelCollapsed,
		toggleLogPanel,
		showLogPanel,
		hideLogPanel,
	};
};

// AI Provider selectors
export const useAIProvider = () => {
	const {
		credentials,
		selectedModel,
		availableModels,
		setApiKey,
		getApiKey,
		clearApiKey,
		clearAllCredentials,
		setSelectedModel,
		getAvailableModels,
		getActiveProviders,
	} = useUserStore();

	return {
		credentials,
		selectedModel,
		availableModels,
		setApiKey,
		getApiKey,
		clearApiKey,
		clearAllCredentials,
		setSelectedModel,
		getAvailableModels,
		getActiveProviders,
	};
};

// Backward compatibility - deprecated
export const useAPICredentials = useAIProvider;

// Fingerprint Hook
export const useFingerprint = () => {
	const visitorId = useUserStore((state) => state.visitorId);
	const isLoading = useUserStore((state) => state.isLoading);
	const error = useUserStore((state) => state.error);
	const initFingerprint = useUserStore((state) => state.initFingerprint);
	const resetFingerprint = useUserStore((state) => state.resetFingerprint);

	return { visitorId, isLoading, error, initFingerprint, resetFingerprint };
};

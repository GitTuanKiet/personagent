import { useCallback } from 'react';
import { useUserStore } from '@/store/user';
import { TerminalPosition } from '../types';

export const useTerminalControls = () => {
	const { terminalPanelCollapsed, terminalPosition } = useUserStore((state) => state.ui);
	const { panels } = useUserStore((state) => state);
	const updateUIPreferences = useUserStore((state) => state.updateUIPreferences);
	const setPanelSize = useUserStore((state) => state.setPanelSize);

	const isRight = terminalPosition === 'right';

	const toggleCollapse = useCallback(() => {
		updateUIPreferences({ terminalPanelCollapsed: !terminalPanelCollapsed });
	}, [terminalPanelCollapsed, updateUIPreferences]);

	const maximizePanel = useCallback(() => {
		if (isRight) {
			const currentWidth = panels.resizablePanelSize;
			// Toggle between maximized (80%) and normal (35%)
			const newWidth = currentWidth >= 70 ? 35 : 80;
			setPanelSize(newWidth);
		} else {
			const currentHeight = panels.resizablePanelSize;
			// Toggle between maximized (95%) and normal (25%)
			const newHeight = currentHeight >= 80 ? 25 : 95;
			setPanelSize(newHeight);
		}
	}, [isRight, panels.resizablePanelSize, setPanelSize]);

	const togglePosition = useCallback(() => {
		updateUIPreferences({
			terminalPosition: isRight ? 'bottom' : 'right',
		});
	}, [isRight, updateUIPreferences]);

	const getMaximizeState = useCallback(() => {
		if (isRight) {
			const isMaximized = panels.resizablePanelSize >= 70;
			return {
				isMaximized,
				title: isMaximized ? 'Restore Panel' : 'Maximize Panel',
			};
		} else {
			const isMaximized = panels.resizablePanelSize >= 80;
			return {
				isMaximized,
				title: isMaximized ? 'Restore Panel' : 'Maximize Panel',
			};
		}
	}, [isRight, panels.resizablePanelSize]);

	const getPositionTitle = useCallback(() => {
		return `Move Terminal to ${isRight ? 'Bottom' : 'Right'}`;
	}, [isRight]);

	return {
		terminalPanelCollapsed,
		terminalPosition,
		isRight,
		toggleCollapse,
		maximizePanel,
		togglePosition,
		getMaximizeState,
		getPositionTitle,
	};
};

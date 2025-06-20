import React, { createContext, useContext } from 'react';
import { useUsabilityIssuesCount } from '../hooks/useUsabilityIssuesCount';

interface UsabilityIssuesCountsContextType {
	allCount: number;
	criticalHighCount: number;
	mediumCount: number;
	lowCount: number;
	isLoading: boolean;
}

const UsabilityIssuesCountsContext = createContext<UsabilityIssuesCountsContextType | null>(null);

export const useUsabilityIssuesCounts = () => {
	const context = useContext(UsabilityIssuesCountsContext);
	if (!context) {
		throw new Error('useUsabilityIssuesCounts must be used within UsabilityIssuesTabsProvider');
	}
	return context;
};

interface UsabilityIssuesTabsProviderProps {
	children: React.ReactNode;
	state?: any;
}

export const UsabilityIssuesTabsProvider: React.FC<UsabilityIssuesTabsProviderProps> = ({
	children,
	state,
}) => {
	const counts = useUsabilityIssuesCount(state);

	return (
		<UsabilityIssuesCountsContext.Provider value={counts}>
			{children}
		</UsabilityIssuesCountsContext.Provider>
	);
};

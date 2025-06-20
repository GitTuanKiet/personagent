import { BugIcon, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { TabConfig } from './types';
import {
	AllIssuesTab,
	CriticalHighIssuesTab,
	MediumIssuesTab,
	LowIssuesTab,
} from './tabs/UsabilityIssuesTab';

// Counter functions - return 0 since we'll show counts in component headers
const getTabCount = () => 0;

export const tabs: readonly TabConfig[] = [
	{
		label: 'All',
		icon: BugIcon,
		value: 'all-issues',
		badge: 'default',
		counter: getTabCount,
		content: (state) => <AllIssuesTab state={state} />,
	},
	{
		label: 'Critical/High',
		icon: AlertTriangle,
		value: 'critical-high',
		badge: 'destructive',
		counter: getTabCount,
		content: (state) => <CriticalHighIssuesTab state={state} />,
	},
	{
		label: 'Medium',
		icon: AlertCircle,
		value: 'medium-issues',
		badge: 'outline',
		counter: getTabCount,
		content: (state) => <MediumIssuesTab state={state} />,
	},
	{
		label: 'Low',
		icon: Info,
		value: 'low-issues',
		badge: 'secondary',
		counter: getTabCount,
		content: (state) => <LowIssuesTab state={state} />,
	},
] as const;

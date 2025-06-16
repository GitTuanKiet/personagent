import { TerminalIcon, DatabaseIcon, BugIcon } from 'lucide-react';
import { TabConfig } from './types';
import { ProblemsTab, getProblemsCount } from './tabs/ProblemsTab';
import { ResultsTab, getResultsCount } from './tabs/ResultsTab';
import { LogsTab, getLogsCount } from './tabs/LogsTab';

export const tabs: readonly TabConfig[] = [
	{
		label: 'Problems',
		icon: BugIcon,
		value: 'problems',
		badge: 'destructive',
		counter: getProblemsCount,
		content: (state) => <ProblemsTab state={state} />,
	},
	{
		label: 'Results',
		icon: DatabaseIcon,
		value: 'results',
		badge: 'secondary',
		counter: getResultsCount,
		content: (state) => <ResultsTab state={state} />,
	},
	{
		label: 'Logs',
		icon: TerminalIcon,
		value: 'logs',
		badge: 'default',
		counter: getLogsCount,
		content: (state) => <LogsTab state={state} />,
	},
] as const;

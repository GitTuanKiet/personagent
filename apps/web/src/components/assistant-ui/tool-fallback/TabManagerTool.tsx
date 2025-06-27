'use client';

import { makeAssistantToolUI } from '@assistant-ui/react';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { PlusIcon, XIcon, RefreshCwIcon } from 'lucide-react';

type TabManagerArgs = {
	action: 'open' | 'close' | 'switch';
	url?: string;
	tab_id?: number;
};

export const TabManagerTool = makeAssistantToolUI<TabManagerArgs, string>({
	toolName: 'tab_manager',
	render: function TabManagerUI({ args, result }) {
		const getIcon = () => {
			switch (args.action) {
				case 'open':
					return <PlusIcon className="h-4 w-4 text-blue-600" />;
				case 'close':
					return <XIcon className="h-4 w-4 text-red-600" />;
				case 'switch':
					return <RefreshCwIcon className="h-4 w-4 text-orange-600" />;
				default:
					return <PlusIcon className="h-4 w-4 text-blue-600" />;
			}
		};

		const getTitle = () => {
			switch (args.action) {
				case 'open':
					return 'Open New Tab';
				case 'close':
					return 'Close Tab';
				case 'switch':
					return 'Switch Tab';
				default:
					return 'Tab Manager';
			}
		};

		const getActionColor = () => {
			switch (args.action) {
				case 'open':
					return 'blue';
				case 'close':
					return 'red';
				case 'switch':
					return 'orange';
				default:
					return 'blue';
			}
		};

		return (
			<Card className="w-full max-w-2xl">
				<CardHeader className="pb-3">
					<div className="flex items-center gap-2">
						{getIcon()}
						<CardTitle className="text-sm font-medium">{getTitle()}</CardTitle>
						<Badge variant={result ? 'default' : 'secondary'} className="ml-auto">
							{result ? 'Completed' : 'Processing'}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="pt-0">
					<div className="space-y-3">
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">Action:</span>
							<Badge variant="outline" className="capitalize">
								{args.action}
							</Badge>
						</div>

						{args.url && (
							<div className="text-sm">
								<span className="text-muted-foreground">URL:</span>
								<div className="mt-1 p-2 bg-blue-50 border border-blue-200 rounded font-mono text-xs break-all">
									{args.url}
								</div>
							</div>
						)}

						{args.tab_id !== undefined && (
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Tab ID:</span>
								<Badge variant="outline">#{args.tab_id}</Badge>
							</div>
						)}

						{result && (
							<div className="text-sm text-green-800 bg-green-50 p-2 rounded">{result}</div>
						)}
					</div>
				</CardContent>
			</Card>
		);
	},
});

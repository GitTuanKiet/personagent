'use client';

import { makeAssistantToolUI } from '@assistant-ui/react';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { ArrowUpIcon, ArrowDownIcon, SearchIcon } from 'lucide-react';

type ScrollArgs = {
	direction: 'up' | 'down' | 'to_text';
	to_text?: string;
	pixel?: number;
};

export const ScrollTool = makeAssistantToolUI<ScrollArgs, string>({
	toolName: 'scroll',
	render: function ScrollUI({ args, result }) {
		const getIcon = () => {
			switch (args.direction) {
				case 'up':
					return <ArrowUpIcon className="h-4 w-4 text-indigo-600" />;
				case 'down':
					return <ArrowDownIcon className="h-4 w-4 text-indigo-600" />;
				case 'to_text':
					return <SearchIcon className="h-4 w-4 text-indigo-600" />;
				default:
					return <ArrowDownIcon className="h-4 w-4 text-indigo-600" />;
			}
		};

		const getTitle = () => {
			switch (args.direction) {
				case 'up':
					return 'Scroll Up';
				case 'down':
					return 'Scroll Down';
				case 'to_text':
					return 'Scroll to Text';
				default:
					return 'Scroll';
			}
		};

		return (
			<Card className="w-full max-w-2xl">
				<CardHeader className="pb-3">
					<div className="flex items-center gap-2">
						{getIcon()}
						<CardTitle className="text-sm font-medium">{getTitle()}</CardTitle>
						<Badge variant={result ? 'default' : 'secondary'} className="ml-auto">
							{result ? 'Completed' : 'Executing'}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="pt-0">
					<div className="space-y-3">
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">Direction:</span>
							<Badge variant="outline" className="capitalize">
								{args.direction.replace('_', ' ')}
							</Badge>
						</div>

						{args.pixel && (
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Amount:</span>
								<span className="text-foreground">{args.pixel} pixels</span>
							</div>
						)}

						{args.to_text && (
							<div className="text-sm">
								<span className="text-muted-foreground">Target Text:</span>
								<p className="mt-1 text-foreground font-mono text-xs bg-gray-50 p-2 rounded">
									{args.to_text}
								</p>
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

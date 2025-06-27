'use client';

import { makeAssistantToolUI } from '@assistant-ui/react';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { ClockIcon } from 'lucide-react';

type WaitArgs = {
	seconds: number;
};

export const WaitTool = makeAssistantToolUI<WaitArgs, string>({
	toolName: 'wait',
	render: function WaitUI({ args, result }) {
		return (
			<Card className="w-full max-w-2xl">
				<CardHeader className="pb-3">
					<div className="flex items-center gap-2">
						<ClockIcon className="h-4 w-4 text-gray-600" />
						<CardTitle className="text-sm font-medium">Wait</CardTitle>
						<Badge variant={result ? 'default' : 'secondary'} className="ml-auto">
							{result ? 'Completed' : 'Waiting'}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="pt-0">
					<div className="space-y-3">
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">Duration:</span>
							<Badge variant="outline">{args.seconds} seconds</Badge>
						</div>

						{!result && (
							<div className="text-sm text-gray-600 bg-gray-50 p-2 rounded flex items-center gap-2">
								<div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
								Waiting for {args.seconds} seconds...
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

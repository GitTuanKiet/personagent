'use client';

import { makeAssistantToolUI } from '@assistant-ui/react';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { CheckCircleIcon, XCircleIcon } from 'lucide-react';

type DoneArgs = {
	text: string;
	ok: boolean;
};

export const DoneTool = makeAssistantToolUI<DoneArgs, string>({
	toolName: 'done',
	render: function DoneUI({ args, result }) {
		return (
			<Card className="w-full max-w-2xl">
				<CardHeader className="pb-3">
					<div className="flex items-center gap-2">
						{args.ok ? (
							<CheckCircleIcon className="h-4 w-4 text-green-600" />
						) : (
							<XCircleIcon className="h-4 w-4 text-red-600" />
						)}
						<CardTitle className="text-sm font-medium">Task Complete</CardTitle>
						<Badge variant={args.ok ? 'default' : 'destructive'} className="ml-auto">
							{args.ok ? 'Success' : 'Failed'}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="pt-0">
					<div className="space-y-3">
						<div className="text-sm">
							<span className="text-muted-foreground">Status:</span>
							<div
								className={`mt-2 p-3 rounded-lg ${args.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
							>
								<p className={`text-sm ${args.ok ? 'text-green-800' : 'text-red-800'}`}>
									{args.text}
								</p>
							</div>
						</div>

						{result && (
							<div className="text-sm text-green-800 bg-green-50 p-2 rounded">{result}</div>
						)}
					</div>
				</CardContent>
			</Card>
		);
	},
});

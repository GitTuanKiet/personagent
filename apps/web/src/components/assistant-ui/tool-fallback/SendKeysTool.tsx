'use client';

import { makeAssistantToolUI } from '@assistant-ui/react';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { CommandIcon } from 'lucide-react';

type SendKeysArgs = {
	keys: string;
};

export const SendKeysTool = makeAssistantToolUI<SendKeysArgs, string>({
	toolName: 'send_keys',
	render: function SendKeysUI({ args, result }) {
		return (
			<Card className="w-full max-w-2xl">
				<CardHeader className="pb-3">
					<div className="flex items-center gap-2">
						<CommandIcon className="h-4 w-4 text-cyan-600" />
						<CardTitle className="text-sm font-medium">Send Keys</CardTitle>
						<Badge variant={result ? 'default' : 'secondary'} className="ml-auto">
							{result ? 'Sent' : 'Sending'}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="pt-0">
					<div className="space-y-3">
						<div className="text-sm">
							<span className="text-muted-foreground">Keys:</span>
							<div className="mt-1 p-2 bg-cyan-50 border border-cyan-200 rounded font-mono text-xs">
								{args.keys}
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

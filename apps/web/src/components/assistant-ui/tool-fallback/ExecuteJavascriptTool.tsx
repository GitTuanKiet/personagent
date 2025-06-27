'use client';

import { makeAssistantToolUI } from '@assistant-ui/react';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { CodeIcon } from 'lucide-react';

type ExecuteJavascriptArgs = {
	javascript_code: string;
};

export const ExecuteJavascriptTool = makeAssistantToolUI<ExecuteJavascriptArgs, string>({
	toolName: 'execute_javascript',
	render: function ExecuteJavascriptUI({ args, result }) {
		return (
			<Card className="w-full max-w-2xl">
				<CardHeader className="pb-3">
					<div className="flex items-center gap-2">
						<CodeIcon className="h-4 w-4 text-yellow-600" />
						<CardTitle className="text-sm font-medium">Execute JavaScript</CardTitle>
						<Badge variant={result ? 'default' : 'secondary'} className="ml-auto">
							{result ? 'Executed' : 'Executing'}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="pt-0">
					<div className="space-y-3">
						<div className="text-sm">
							<span className="text-muted-foreground">JavaScript Code:</span>
							<pre className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs font-mono overflow-x-auto">
								<code>{args.javascript_code}</code>
							</pre>
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

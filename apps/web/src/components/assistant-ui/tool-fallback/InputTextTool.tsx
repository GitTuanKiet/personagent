'use client';

import { makeAssistantToolUI } from '@assistant-ui/react';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { KeyboardIcon } from 'lucide-react';

type InputTextArgs = {
	index: number;
	text: string;
};

export const InputTextTool = makeAssistantToolUI<InputTextArgs, string>({
	toolName: 'input_text',
	render: function InputTextUI({ args, result }) {
		return (
			<Card className="w-full max-w-2xl">
				<CardHeader className="pb-3">
					<div className="flex items-center gap-2">
						<KeyboardIcon className="h-4 w-4 text-orange-600" />
						<CardTitle className="text-sm font-medium">Input Text</CardTitle>
						<Badge variant={result ? 'default' : 'secondary'} className="ml-auto">
							{result ? 'Completed' : 'Executing'}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="pt-0">
					<div className="space-y-3">
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">Target Element:</span>
							<Badge variant="outline">Index #{args.index}</Badge>
						</div>

						<div className="text-sm">
							<span className="text-muted-foreground">Text to Input:</span>
							<div className="mt-1 p-2 bg-orange-50 border border-orange-200 rounded font-mono text-xs">
								"{args.text}"
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

'use client';

import { makeAssistantToolUI } from '@assistant-ui/react';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { TypeIcon } from 'lucide-react';

type TypeTextArgs = {
	element_index: number;
	text: string;
};

type TypeTextResult = {
	success: boolean;
	message: string;
	typed_text?: string;
};

export const TypeTextTool = makeAssistantToolUI<TypeTextArgs, string>({
	toolName: 'type_text',
	render: function TypeTextUI({ args, result }) {
		let resultObj: TypeTextResult | { error: string } | null = null;

		if (result) {
			try {
				resultObj = JSON.parse(result);
			} catch (e) {
				resultObj = { error: result };
			}
		}

		return (
			<Card className="w-full max-w-2xl">
				<CardHeader className="pb-3">
					<div className="flex items-center gap-2">
						<TypeIcon className="h-4 w-4 text-green-600" />
						<CardTitle className="text-sm font-medium">Type Text</CardTitle>
						<Badge
							variant={
								resultObj && 'success' in resultObj && resultObj.success ? 'default' : 'secondary'
							}
							className="ml-auto"
						>
							{resultObj
								? 'success' in resultObj && resultObj.success
									? 'Success'
									: 'Failed'
								: 'Typing'}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="pt-0">
					<div className="space-y-3">
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">Target Element:</span>
							<Badge variant="outline">Index #{args.element_index}</Badge>
						</div>

						<div className="text-sm">
							<span className="text-muted-foreground">Text Input:</span>
							<div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
								<code className="text-sm text-green-800 font-mono break-all">"{args.text}"</code>
							</div>
						</div>

						{resultObj && 'typed_text' in resultObj && resultObj.typed_text && (
							<div className="text-sm">
								<span className="text-muted-foreground">Successfully Typed:</span>
								<div className="mt-1 p-2 bg-blue-50 rounded text-blue-800 font-mono text-xs">
									{resultObj.typed_text}
								</div>
							</div>
						)}

						{resultObj && 'message' in resultObj && (
							<div
								className={`text-sm p-2 rounded ${
									'success' in resultObj && resultObj.success
										? 'bg-green-50 text-green-800'
										: 'bg-red-50 text-red-800'
								}`}
							>
								{resultObj.message}
							</div>
						)}

						{resultObj && 'error' in resultObj && (
							<div className="text-sm text-red-600 bg-red-50 p-2 rounded">
								Error: {resultObj.error}
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		);
	},
});

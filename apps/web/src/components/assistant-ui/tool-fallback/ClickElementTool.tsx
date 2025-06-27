'use client';

import { makeAssistantToolUI } from '@assistant-ui/react';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { MousePointerClickIcon } from 'lucide-react';

type ClickElementArgs = {
	element_index: number;
	reason?: string;
};

type ClickElementResult = {
	success: boolean;
	message: string;
	element_info?: {
		tag: string;
		text: string;
		role?: string;
	};
};

export const ClickElementTool = makeAssistantToolUI<ClickElementArgs, string>({
	toolName: 'click_element_by_index',
	render: function ClickElementUI({ args, result }) {
		let resultObj: ClickElementResult | { error: string } | null = null;

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
						<MousePointerClickIcon className="h-4 w-4 text-blue-600" />
						<CardTitle className="text-sm font-medium">Click Element</CardTitle>
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
								: 'Executing'}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="pt-0">
					<div className="space-y-3">
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">Target Element:</span>
							<Badge variant="outline">Index #{args.element_index}</Badge>
						</div>

						{args.reason && (
							<div className="text-sm">
								<span className="text-muted-foreground">Reason:</span>
								<p className="mt-1 text-foreground">{args.reason}</p>
							</div>
						)}

						{resultObj && 'element_info' in resultObj && resultObj.element_info && (
							<div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
								<p className="text-sm font-medium text-blue-900 mb-2">Element Details:</p>
								<div className="space-y-1 text-xs">
									<div>
										<span className="font-medium">Tag:</span> {resultObj.element_info.tag}
									</div>
									<div>
										<span className="font-medium">Text:</span> {resultObj.element_info.text}
									</div>
									{resultObj.element_info.role && (
										<div>
											<span className="font-medium">Role:</span> {resultObj.element_info.role}
										</div>
									)}
								</div>
							</div>
						)}

						{resultObj && 'message' in resultObj && (
							<div
								className={`text-sm p-2 rounded ${
									resultObj.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
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

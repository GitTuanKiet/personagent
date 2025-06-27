'use client';

import { makeAssistantToolUI } from '@assistant-ui/react';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { NavigationIcon, ExternalLinkIcon, AlertTriangleIcon } from 'lucide-react';

type NavigateArgs = {
	url: string;
};

type NavigateResult = {
	approve?: boolean;
	cancelled?: boolean;
	success?: boolean;
	final_url?: string;
	title?: string;
	error?: string;
};

export const NavigateTool = makeAssistantToolUI<NavigateArgs, string>({
	toolName: 'navigate',
	render: function NavigateUI({ args, result, status, addResult }) {
		let resultObj: NavigateResult | { error: string } | null = null;

		if (result) {
			try {
				resultObj = JSON.parse(result);
			} catch (e) {
				resultObj = { error: result };
			}
		}

		// Check if this is a potentially risky navigation that needs approval
		const needsApproval =
			args.url.includes('login') ||
			args.url.includes('admin') ||
			args.url.includes('delete') ||
			args.url.includes('payment') ||
			!args.url.startsWith('http');

		const handleApprove = () => {
			if (addResult) {
				addResult(JSON.stringify({ approve: true }));
			}
		};

		const handleReject = () => {
			if (addResult) {
				addResult(JSON.stringify({ cancelled: true }));
			}
		};

		return (
			<Card className="w-full max-w-2xl">
				<CardHeader className="pb-3">
					<div className="flex items-center gap-2">
						<NavigationIcon className="h-4 w-4 text-purple-600" />
						<CardTitle className="text-sm font-medium">Navigate</CardTitle>
						<Badge
							variant={
								resultObj && 'success' in resultObj && resultObj.success
									? 'default'
									: resultObj && 'cancelled' in resultObj && resultObj.cancelled
										? 'destructive'
										: 'secondary'
							}
							className="ml-auto"
						>
							{resultObj
								? 'success' in resultObj && resultObj.success
									? 'Success'
									: 'cancelled' in resultObj && resultObj.cancelled
										? 'Cancelled'
										: 'Failed'
								: 'Navigating'}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="pt-0">
					<div className="space-y-3">
						<div className="text-sm">
							<span className="text-muted-foreground">Destination URL:</span>
							<div className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-200 flex items-center gap-2">
								<ExternalLinkIcon className="h-4 w-4 text-purple-600 flex-shrink-0" />
								<code className="text-sm text-purple-800 font-mono break-all flex-1">
									{args.url}
								</code>
							</div>
						</div>

						{/* Approval UI for risky navigation */}
						{needsApproval && !result && status.type !== 'running' && (
							<div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
								<div className="flex items-center gap-2 mb-3">
									<AlertTriangleIcon className="h-4 w-4 text-amber-600" />
									<span className="text-sm font-medium text-amber-800">Approval Required</span>
								</div>
								<p className="text-sm text-amber-700 mb-4">
									This navigation appears to be potentially sensitive. Do you want to proceed?
								</p>
								<div className="flex gap-2">
									<Button
										size="sm"
										onClick={handleApprove}
										className="bg-green-600 hover:bg-green-700"
									>
										Approve Navigation
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={handleReject}
										className="border-red-300 text-red-700 hover:bg-red-50"
									>
										Cancel
									</Button>
								</div>
							</div>
						)}

						{/* Success result */}
						{resultObj && 'success' in resultObj && resultObj.success && (
							<div className="p-3 bg-green-50 border border-green-200 rounded-lg">
								<p className="text-sm font-medium text-green-800 mb-2">Navigation Successful</p>
								{resultObj.final_url && (
									<p className="text-xs text-green-700">Final URL: {resultObj.final_url}</p>
								)}
								{resultObj.title && (
									<p className="text-xs text-green-700">Page Title: {resultObj.title}</p>
								)}
							</div>
						)}

						{/* Cancelled result */}
						{resultObj && 'cancelled' in resultObj && resultObj.cancelled && (
							<div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
								<span className="font-medium">Navigation Cancelled</span>
								<p className="text-xs mt-1">User rejected the navigation request.</p>
							</div>
						)}

						{/* Error result */}
						{resultObj && 'error' in resultObj && (
							<div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
								<span className="font-medium">Navigation Failed</span>
								<p className="text-xs mt-1">Error: {resultObj.error}</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		);
	},
});

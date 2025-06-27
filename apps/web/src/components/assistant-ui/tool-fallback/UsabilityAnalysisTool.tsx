'use client';

import { makeAssistantToolUI } from '@assistant-ui/react';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { AlertTriangleIcon, CheckCircleIcon, XCircleIcon, InfoIcon } from 'lucide-react';

type UsabilityAnalysisArgs = {
	action_history: string;
	total_actions: number;
	total_steps: number;
	isDone: boolean;
};

type UsabilityIssue = {
	description: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
	impact: 'minor' | 'moderate' | 'major' | 'blocker';
	recommendation: string;
	context: string;
	category: string;
};

type UsabilityAnalysisResult = {
	summary: string;
	taskCompletion: boolean;
	totalSteps: number;
	issues: UsabilityIssue[];
};

export const UsabilityAnalysisTool = makeAssistantToolUI<UsabilityAnalysisArgs, string>({
	toolName: 'analyze_usability',
	render: function UsabilityAnalysisUI({ args, result }) {
		let resultObj: UsabilityAnalysisResult | { error: string } | null = null;

		if (result) {
			try {
				resultObj = JSON.parse(result);
			} catch (e) {
				resultObj = { error: result };
			}
		}

		const getSeverityConfig = (severity: string) => {
			switch (severity) {
				case 'critical':
					return {
						color: 'bg-red-100 text-red-800 border-red-200',
						icon: <XCircleIcon className="h-3 w-3" />,
					};
				case 'high':
					return {
						color: 'bg-orange-100 text-orange-800 border-orange-200',
						icon: <AlertTriangleIcon className="h-3 w-3" />,
					};
				case 'medium':
					return {
						color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
						icon: <InfoIcon className="h-3 w-3" />,
					};
				case 'low':
					return {
						color: 'bg-blue-100 text-blue-800 border-blue-200',
						icon: <InfoIcon className="h-3 w-3" />,
					};
				default:
					return {
						color: 'bg-gray-100 text-gray-800 border-gray-200',
						icon: <InfoIcon className="h-3 w-3" />,
					};
			}
		};

		return (
			<Card className="w-full max-w-4xl border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
				<CardHeader className="pb-4">
					<div className="flex items-center gap-2">
						<AlertTriangleIcon className="h-5 w-5 text-amber-600" />
						<CardTitle className="text-lg font-semibold text-amber-800">
							UX Usability Analysis
						</CardTitle>
						<Badge variant="outline" className="ml-auto border-amber-300 text-amber-700">
							{resultObj ? 'Completed' : 'Analyzing'}
						</Badge>
					</div>
				</CardHeader>

				<CardContent className="pt-0">
					<div className="space-y-4">
						{/* Analysis Progress */}
						<div className="grid grid-cols-3 gap-4 p-4 bg-white rounded-lg border border-amber-200">
							<div className="text-center">
								<p className="text-2xl font-bold text-amber-800">{args.total_actions}</p>
								<p className="text-xs text-amber-600">Actions Analyzed</p>
							</div>
							<div className="text-center">
								<p className="text-2xl font-bold text-amber-800">{args.total_steps}</p>
								<p className="text-xs text-amber-600">Total Steps</p>
							</div>
							<div className="text-center">
								<div className="flex items-center justify-center mb-1">
									{args.isDone ? (
										<CheckCircleIcon className="h-6 w-6 text-green-600" />
									) : (
										<div className="h-6 w-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
									)}
								</div>
								<p className="text-xs text-amber-600">
									{args.isDone ? 'Task Complete' : 'In Progress'}
								</p>
							</div>
						</div>

						{/* Results or Loading State */}
						{resultObj && 'summary' in resultObj ? (
							<div className="space-y-4">
								<div className="p-4 bg-white rounded-lg border border-amber-200">
									<h3 className="font-semibold text-amber-800 mb-2">Analysis Summary</h3>
									<p className="text-sm text-gray-700">{resultObj.summary}</p>
									<div className="flex items-center gap-4 mt-3 pt-3 border-t border-amber-100">
										<Badge variant={resultObj.taskCompletion ? 'default' : 'destructive'}>
											{resultObj.taskCompletion ? 'Task Success' : 'Task Incomplete'}
										</Badge>
										<span className="text-xs text-gray-600">
											{resultObj.issues.length} issues found
										</span>
									</div>
								</div>

								{resultObj.issues.map((issue, index) => {
									const severityConfig = getSeverityConfig(issue.severity);
									return (
										<div key={index} className="p-4 bg-white rounded-lg border border-gray-200">
											<div className="flex items-start gap-3">
												<Badge className={`${severityConfig.color} border text-xs`}>
													{issue.severity.toUpperCase()}
												</Badge>
												<div className="flex-1">
													<h4 className="font-medium text-gray-900 mb-1">{issue.description}</h4>
													<p className="text-sm text-green-700 mb-2">💡 {issue.recommendation}</p>
													<div className="text-xs text-gray-600">
														<span className="font-medium">Category:</span> {issue.category} •
														<span className="font-medium"> Impact:</span> {issue.impact}
													</div>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						) : resultObj && 'error' in resultObj ? (
							<div className="p-4 bg-red-50 rounded-lg border border-red-200">
								<p className="text-sm text-red-700">Analysis failed: {resultObj.error}</p>
							</div>
						) : (
							<div className="p-6 text-center">
								<div className="h-8 w-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
								<p className="text-sm text-amber-700 font-medium">
									Analyzing user interaction patterns...
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		);
	},
});

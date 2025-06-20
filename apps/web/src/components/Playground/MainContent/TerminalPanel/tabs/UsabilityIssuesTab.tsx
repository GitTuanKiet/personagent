import React, { useState, useEffect } from 'react';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import {
	usabilityIssueService,
	type UsabilityIssueQueryParams,
} from '@/services/usabilityIssue.service';
import {
	type UsabilityIssueSelect,
	type UsabilitySeverity,
	UsabilitySeverity as SeverityEnum,
} from '@/database/client/schema';
import { AlertTriangle, Info, AlertCircle, RefreshCw } from 'lucide-react';

interface UsabilityIssuesTabProps {
	state?: any;
	severityFilter?: UsabilitySeverity[] | 'all';
	title?: string;
}

export const UsabilityIssuesTab: React.FC<UsabilityIssuesTabProps> = ({
	state,
	severityFilter = 'all',
	title = 'Usability Issues',
}) => {
	const [issues, setIssues] = useState<UsabilityIssueSelect[]>([]);
	const [loading, setLoading] = useState(false);
	const [totalCount, setTotalCount] = useState(0);

	const loadIssues = async () => {
		setLoading(true);
		try {
			const params: UsabilityIssueQueryParams = {
				limit: 50,
				order: 'desc',
			};

			// If we have simulation state, filter by simulation
			if (state?.simulationId) {
				params.simulationId = state.simulationId;
			}

			// Apply severity filter
			if (severityFilter !== 'all' && Array.isArray(severityFilter) && severityFilter.length > 0) {
				// For now, we'll filter on the client side since the service only supports single severity
				// We could enhance the service later to support multiple severities
			}

			const result = await usabilityIssueService.queryBy(params);

			// Client-side filtering by severity if needed
			let filteredData = result.data;
			if (severityFilter !== 'all' && Array.isArray(severityFilter)) {
				filteredData = result.data.filter((issue) =>
					severityFilter.includes(issue.severity as UsabilitySeverity),
				);
			}

			setIssues(filteredData);
			setTotalCount(filteredData.length);
		} catch (error) {
			console.error('Failed to load usability issues:', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadIssues();
	}, [state, severityFilter]);

	const getSeverityIcon = (severity: string) => {
		switch (severity) {
			case 'critical':
			case 'high':
				return <AlertTriangle size={16} className="text-red-500" />;
			case 'medium':
				return <AlertCircle size={16} className="text-yellow-500" />;
			case 'low':
				return <Info size={16} className="text-blue-500" />;
			default:
				return <Info size={16} className="text-gray-500" />;
		}
	};

	const getSeverityColor = (severity: string) => {
		switch (severity) {
			case 'critical':
			case 'high':
				return 'destructive';
			case 'medium':
				return 'outline';
			case 'low':
				return 'secondary';
			default:
				return 'default';
		}
	};

	return (
		<div className="flex flex-col h-full bg-[#1e1e1e] text-[#cccccc]">
			{/* Header */}
			<div className="flex items-center justify-between p-3 border-b border-[#2d2d30]">
				<div className="flex items-center gap-2">
					<h3 className="text-sm font-medium">{title}</h3>
					{totalCount > 0 && (
						<Badge variant="secondary" className="text-xs">
							{totalCount}
						</Badge>
					)}
				</div>
				<Button
					variant="ghost"
					size="sm"
					onClick={loadIssues}
					disabled={loading}
					className="h-6 w-6 p-0 text-[#cccccc] hover:bg-[#2d2d30]"
				>
					<RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
				</Button>
			</div>

			{/* Content */}
			<ScrollArea className="flex-1">
				{loading ? (
					<div className="flex items-center justify-center h-20">
						<RefreshCw size={16} className="animate-spin text-[#cccccc]" />
					</div>
				) : issues.length === 0 ? (
					<div className="flex items-center justify-center h-20 text-[#858585] text-sm">
						No usability issues found
					</div>
				) : (
					<div className="p-2 space-y-2">
						{issues.map((issue) => (
							<div
								key={issue.id}
								className="p-3 bg-[#252526] border border-[#2d2d30] rounded hover:bg-[#2d2d30] cursor-pointer"
							>
								<div className="flex items-start gap-2">
									{getSeverityIcon(issue.severity)}
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-1">
											<Badge variant={getSeverityColor(issue.severity)} className="text-xs">
												{issue.severity}
											</Badge>
											{issue.impact && (
												<Badge variant="outline" className="text-xs">
													{issue.impact}
												</Badge>
											)}
										</div>
										<p className="text-sm text-[#cccccc] mb-1 line-clamp-2">{issue.description}</p>
										{issue.recommendation && (
											<p className="text-xs text-[#858585] line-clamp-1">
												Recommendation: {issue.recommendation}
											</p>
										)}
										<div className="flex items-center gap-2 mt-2 text-xs text-[#858585]">
											{issue.createdAt && <span>{new Date(issue.createdAt).toLocaleString()}</span>}
											{issue.personaId && <span>Persona: {issue.personaId}</span>}
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</ScrollArea>
		</div>
	);
};

// Wrapper components for different severity filters
export const AllIssuesTab: React.FC<{ state?: any }> = ({ state }) => (
	<UsabilityIssuesTab state={state} severityFilter="all" title="All Issues" />
);

export const CriticalHighIssuesTab: React.FC<{ state?: any }> = ({ state }) => (
	<UsabilityIssuesTab
		state={state}
		severityFilter={[SeverityEnum.Critical, SeverityEnum.High]}
		title="Critical & High"
	/>
);

export const MediumIssuesTab: React.FC<{ state?: any }> = ({ state }) => (
	<UsabilityIssuesTab state={state} severityFilter={[SeverityEnum.Medium]} title="Medium Issues" />
);

export const LowIssuesTab: React.FC<{ state?: any }> = ({ state }) => (
	<UsabilityIssuesTab state={state} severityFilter={[SeverityEnum.Low]} title="Low Issues" />
);

// Note: Actual counts are now shown in the component headers
// The tab counters in tabsConfig return 0

import { useState, useEffect } from 'react';
import { usabilityIssueService } from '@/services/usabilityIssue.service';
import { UsabilitySeverity } from '@/database/client/schema';

interface UseUsabilityIssuesCountResult {
	allCount: number;
	criticalHighCount: number;
	mediumCount: number;
	lowCount: number;
	isLoading: boolean;
}

export const useUsabilityIssuesCount = (state?: any): UseUsabilityIssuesCountResult => {
	const [counts, setCounts] = useState({
		allCount: 0,
		criticalHighCount: 0,
		mediumCount: 0,
		lowCount: 0,
	});
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		const loadCounts = async () => {
			setIsLoading(true);
			try {
				const baseParams = state?.simulationId ? { simulationId: state.simulationId } : {};

				// Load all counts in parallel
				const [allResult, criticalResult, highResult, mediumResult, lowResult] = await Promise.all([
					usabilityIssueService.queryBy({ ...baseParams, limit: 1 }),
					usabilityIssueService.countBy({ ...baseParams, severity: UsabilitySeverity.Critical }),
					usabilityIssueService.countBy({ ...baseParams, severity: UsabilitySeverity.High }),
					usabilityIssueService.countBy({ ...baseParams, severity: UsabilitySeverity.Medium }),
					usabilityIssueService.countBy({ ...baseParams, severity: UsabilitySeverity.Low }),
				]);

				setCounts({
					allCount: allResult.totalCount,
					criticalHighCount: criticalResult + highResult,
					mediumCount: mediumResult,
					lowCount: lowResult,
				});
			} catch (error) {
				console.error('Failed to load usability issues counts:', error);
			} finally {
				setIsLoading(false);
			}
		};

		loadCounts();
	}, [state]);

	return { ...counts, isLoading };
};
